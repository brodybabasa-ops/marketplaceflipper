import type { IdentifierKind, Prisma, UsageUnit } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ASSET_TYPES,
  INDUSTRIES,
  INSPECTION_TEMPLATES,
  MAINTENANCE_RULES,
  REVENUE_STREAMS,
  TAXONOMY,
  garageHeadline,
  type IndustryKey,
} from "@/lib/catalog";
import { assetLabel, formatUsage, vehicleLabel } from "@/lib/asset-display";

const catalogInclude = {
  industry: true,
  assetType: true,
  identifiers: true,
  components: true,
  vehicle: { include: { make: true, model: true } },
  recommendedWork: { where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 3 },
  jobs: {
    where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    include: { mechanicProfile: true },
    orderBy: { updatedAt: "desc" },
    take: 1,
  },
  repairRecords: { orderBy: { createdAt: "desc" }, take: 1, include: { job: { include: { mechanicProfile: true } } } },
  inspections: { include: { findings: true }, orderBy: { createdAt: "desc" }, take: 3 },
} satisfies Prisma.AssetInclude;

export type GarageAsset = Prisma.AssetGetPayload<{ include: typeof catalogInclude }>;

export async function seedIndustryCatalog() {
  const industries = [];
  for (const item of INDUSTRIES) {
    const industry = await prisma.industry.upsert({
      where: { key: item.key },
      update: {
        name: item.name,
        consumerLabel: item.consumerLabel,
        intakePrompt: item.intakePrompt,
        intakePlaceholder: item.intakePlaceholder,
        defaultUsageUnit: item.usageUnit,
        sortOrder: item.sortOrder,
        active: true,
      },
      create: {
        key: item.key,
        name: item.name,
        consumerLabel: item.consumerLabel,
        intakePrompt: item.intakePrompt,
        intakePlaceholder: item.intakePlaceholder,
        defaultUsageUnit: item.usageUnit,
        sortOrder: item.sortOrder,
      },
    });
    industries.push(industry);
  }
  const byKey = Object.fromEntries(industries.map((item) => [item.key, item])) as Record<IndustryKey, (typeof industries)[number]>;

  for (const type of ASSET_TYPES) {
    await prisma.assetType.upsert({
      where: { industryId_key: { industryId: byKey[type.industry].id, key: type.key } },
      update: { name: type.name },
      create: { industryId: byKey[type.industry].id, key: type.key, name: type.name },
    });
  }

  for (const [index, item] of TAXONOMY.entries()) {
    await prisma.serviceTaxonomy.upsert({
      where: { industryId_key: { industryId: byKey[item.industry].id, key: item.key } },
      update: { label: item.label, helper: item.helper, sortOrder: index, active: true },
      create: {
        industryId: byKey[item.industry].id,
        key: item.key,
        label: item.label,
        helper: item.helper,
        sortOrder: index,
      },
    });
  }

  for (const template of INSPECTION_TEMPLATES) {
    await prisma.inspectionTemplate.upsert({
      where: { key: template.key },
      update: {
        name: template.name,
        kind: template.kind,
        sections: template.sections,
        industryId: byKey[template.industry].id,
        active: true,
      },
      create: {
        industryId: byKey[template.industry].id,
        key: template.key,
        name: template.name,
        kind: template.kind,
        sections: template.sections,
      },
    });
  }

  await prisma.maintenanceRule.deleteMany();
  await prisma.maintenanceRule.createMany({
    data: MAINTENANCE_RULES.map((rule) => ({
      industryId: byKey[rule.industry].id,
      title: rule.title,
      intervalValue: rule.intervalValue,
      intervalUnit: rule.intervalUnit,
      taxonomyKey: rule.taxonomyKey,
    })),
  });

  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  if (config) {
    await prisma.platformConfig.update({
      where: { id: "default" },
      data: { revenueStreams: [...REVENUE_STREAMS] },
    });
  }

  return byKey;
}

export async function createAutomotiveAsset(vehicle: {
  id: string;
  customerId: string;
  year: number;
  mileage: number;
  vin?: string | null;
  plate?: string | null;
  trim?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  makeName: string;
  modelName: string;
  assetTypeKey?: string;
}) {
  const industry = await prisma.industry.findUniqueOrThrow({ where: { key: "AUTOMOTIVE" } });
  const typeKey = vehicle.assetTypeKey ?? (vehicle.modelName.toLowerCase().includes("f-") ? "TRUCK" : "CAR");
  const assetType =
    (await prisma.assetType.findUnique({
      where: { industryId_key: { industryId: industry.id, key: typeKey } },
    })) ??
    (await prisma.assetType.findUniqueOrThrow({
      where: { industryId_key: { industryId: industry.id, key: "CAR" } },
    }));

  const identifiers: { kind: IdentifierKind; value: string }[] = [];
  if (vehicle.vin) identifiers.push({ kind: "VIN", value: vehicle.vin });
  if (vehicle.plate) identifiers.push({ kind: "LICENSE_PLATE", value: vehicle.plate });

  return prisma.asset.upsert({
    where: { vehicleId: vehicle.id },
    update: {
      year: vehicle.year,
      manufacturer: vehicle.makeName,
      model: vehicle.modelName,
      trim: vehicle.trim,
      nickname: vehicle.nickname,
      photoUrl: vehicle.photoUrl,
      usageValue: vehicle.mileage,
      usageUnit: "MILES",
    },
    create: {
      ownerId: vehicle.customerId,
      industryId: industry.id,
      assetTypeId: assetType.id,
      vehicleId: vehicle.id,
      year: vehicle.year,
      manufacturer: vehicle.makeName,
      model: vehicle.modelName,
      trim: vehicle.trim,
      nickname: vehicle.nickname,
      photoUrl: vehicle.photoUrl,
      usageValue: vehicle.mileage,
      usageUnit: "MILES",
      identifiers: identifiers.length ? { create: identifiers } : undefined,
    },
  });
}

export async function createGenericAsset(input: {
  ownerId: string;
  industryKey: IndustryKey;
  assetTypeKey: string;
  year?: number;
  manufacturer: string;
  model: string;
  trim?: string;
  nickname?: string;
  usageValue?: number;
  usageUnit?: UsageUnit;
  location?: string;
  identifiers?: { kind: IdentifierKind; value: string; label?: string }[];
  components?: { name: string; kind?: string }[];
}) {
  const industry = await prisma.industry.findUniqueOrThrow({ where: { key: input.industryKey } });
  const assetType = await prisma.assetType.findUniqueOrThrow({
    where: { industryId_key: { industryId: industry.id, key: input.assetTypeKey } },
  });
  return prisma.asset.create({
    data: {
      ownerId: input.ownerId,
      industryId: industry.id,
      assetTypeId: assetType.id,
      year: input.year,
      manufacturer: input.manufacturer,
      model: input.model,
      trim: input.trim,
      nickname: input.nickname,
      usageValue: input.usageValue,
      usageUnit: input.usageUnit ?? industry.defaultUsageUnit,
      location: input.location,
      identifiers: input.identifiers?.length ? { create: input.identifiers } : undefined,
      components: input.components?.length ? { create: input.components } : undefined,
    },
  });
}

export function healthFromFindings(
  findings: { section: string; status: "GOOD" | "MONITOR" | "NEEDS_ATTENTION" }[],
) {
  if (!findings.length) return { score: null as number | null, sections: [] as { section: string; status: string }[] };
  const latest = new Map<string, string>();
  for (const finding of findings) latest.set(finding.section, finding.status);
  return {
    score: null,
    sections: [...latest.entries()].map(([section, status]) => ({ section, status })),
  };
}

export function dueMaintenance(
  usageValue: number | null | undefined,
  usageUnit: UsageUnit,
  rules: { title: string; intervalValue: number; intervalUnit: UsageUnit }[],
) {
  if (usageValue == null) return [];
  return rules
    .filter((rule) => rule.intervalUnit === usageUnit && usageValue >= rule.intervalValue)
    .map((rule) => ({ title: rule.title, due: true as const }));
}

export async function listGarage(ownerId: string) {
  const assets = await prisma.asset.findMany({
    where: { ownerId, status: "ACTIVE" },
    include: catalogInclude,
    orderBy: { createdAt: "desc" },
  });
  const headline = garageHeadline(assets.map((item) => item.industry.key));
  return { assets, headline };
}

export function garageCardCopy(asset: GarageAsset) {
  const title = asset.vehicle
    ? vehicleLabel(asset.vehicle)
    : assetLabel(asset);
  const findings = asset.inspections.flatMap((item) => item.findings);
  const health = healthFromFindings(findings);
  const openJob = asset.jobs[0];
  const lastService = asset.repairRecords[0];
  return {
    id: asset.id,
    vehicleId: asset.vehicleId,
    title,
    industry: asset.industry.name,
    industryKey: asset.industry.key,
    typeName: asset.assetType.name,
    nickname: asset.nickname,
    usage: formatUsage(asset.usageValue, asset.usageUnit),
    health,
    upcoming: dueMaintenance(asset.usageValue, asset.usageUnit, []).length
      ? "Service interval reached"
      : null,
    openRecommendations: asset.recommendedWork.length,
    activeRepair: openJob ? openJob.mechanicProfile.businessName : null,
    lastService: lastService?.title ?? null,
    primaryProvider: lastService?.job.mechanicProfile.businessName ?? openJob?.mechanicProfile.businessName ?? null,
  };
}

export type GarageCardCopy = ReturnType<typeof garageCardCopy>;

export async function attachProviderIndustries(mechanicProfileId: string, industryKeys: string[], verifiedKey?: string) {
  const industries = await prisma.industry.findMany({ where: { key: { in: industryKeys } } });
  for (const industry of industries) {
    const verified = verifiedKey === industry.key;
    await prisma.providerIndustry.upsert({
      where: { mechanicProfileId_industryId: { mechanicProfileId, industryId: industry.id } },
      update: verified
        ? { verified: true, verifiedAt: new Date(), verificationLevel: "POCKET_VERIFIED" }
        : {},
      create: {
        mechanicProfileId,
        industryId: industry.id,
        verified,
        verifiedAt: verified ? new Date() : undefined,
        verificationLevel: verified ? "POCKET_VERIFIED" : "UNVERIFIED",
      },
    });
  }
}
