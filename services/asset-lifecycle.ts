import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assetLabel, formatUsage, vehicleLabel } from "@/lib/asset-display";
import { evaluateMaintenance } from "@/services/maintenance";
import { healthFromFindings } from "@/services/assets";
import { warrantiesForAsset } from "@/services/warranties";

export async function getAssetHome(assetId: string, ownerId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, OR: [{ ownerId }, { shares: { some: { memberId: ownerId } } }] },
    include: {
      industry: true,
      assetType: true,
      identifiers: true,
      components: true,
      vehicle: { include: { make: true, model: true } },
      documents: { orderBy: { createdAt: "desc" } },
      preferredProviders: { include: { mechanic: true } },
      repairRecords: { include: { job: { include: { mechanicProfile: true } } }, orderBy: { createdAt: "desc" } },
      inspections: { include: { findings: true }, orderBy: { createdAt: "desc" } },
      recommendedWork: { where: { status: "OPEN" }, include: { mechanic: true } },
      jobs: {
        where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
        include: { mechanicProfile: true, serviceRequest: true },
        orderBy: { updatedAt: "desc" },
      },
      outcomes: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!asset) return null;
  const warranties = await warrantiesForAsset(asset.id);
  const health = healthFromFindings(asset.inspections.flatMap((item) => item.findings));
  const maintenance = evaluateMaintenance({
    industryKey: asset.industry.key,
    usageValue: asset.usageValue,
    usageUnit: asset.usageUnit,
    createdAt: asset.createdAt,
  });
  const spend = asset.repairRecords.reduce((sum, item) => sum + (item.job.totalCents ?? 0), 0);
  return { asset, warranties, health, maintenance, spend };
}

export async function verifiedServiceReport(assetId: string, requesterId: string) {
  const home = await getAssetHome(assetId, requesterId);
  if (!home) return null;
  const { asset, warranties, health, maintenance } = home;
  const title = asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset);
  return {
    title,
    usage: formatUsage(asset.usageValue, asset.usageUnit),
    industry: asset.industry.name,
    verifiedRecords: asset.repairRecords.length,
    unresolved: asset.recommendedWork.map((item) => item.title),
    inspections: asset.inspections.length,
    healthSections: health.sections,
    maintenance: maintenance.filter((item) => item.status !== "UPCOMING"),
    warranties: warranties.map((item) => ({
      title: item.title,
      parts: item.partsCoverage,
      labor: item.laborCoverage,
      provider: item.providerName,
    })),
    history: asset.repairRecords.map((record) => ({
      date: record.createdAt,
      title: record.title,
      provider: record.job.mechanicProfile.businessName,
      amountCents: record.job.totalCents,
      diagnosis: record.diagnosis,
    })),
    privacyNote: "Customer contact details, messages, and payment instruments are not included.",
  };
}

export async function transferAsset(input: {
  assetId: string;
  fromOwnerId: string;
  toEmail: string;
  includeHistory: boolean;
}) {
  const asset = await prisma.asset.findFirst({ where: { id: input.assetId, ownerId: input.fromOwnerId } });
  if (!asset) throw new Error("Asset not found.");
  const recipient = await prisma.user.findUnique({ where: { email: input.toEmail.toLowerCase() } });
  const transfer = await prisma.assetTransfer.create({
    data: {
      assetId: asset.id,
      fromOwnerId: input.fromOwnerId,
      toOwnerId: recipient?.id,
      toEmail: input.toEmail.toLowerCase(),
      includeHistory: input.includeHistory,
      status: recipient ? "COMPLETED" : "PENDING",
      completedAt: recipient ? new Date() : undefined,
    },
  });
  if (recipient) {
    await prisma.asset.update({
      where: { id: asset.id },
      data: { ownerId: recipient.id },
    });
    if (asset.vehicleId) {
      await prisma.vehicle.update({
        where: { id: asset.vehicleId },
        data: { customerId: recipient.id },
      });
    }
  }
  await audit({
    actorId: input.fromOwnerId,
    action: "ASSET_TRANSFER",
    targetType: "Asset",
    targetId: asset.id,
    metadata: { toEmail: input.toEmail, includeHistory: input.includeHistory, completed: Boolean(recipient) },
  });
  return transfer;
}
