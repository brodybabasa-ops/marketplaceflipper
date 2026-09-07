import type { MaintenanceItemStatus, UsageUnit } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MAINTENANCE_RULES } from "@/lib/catalog";
import { formatUsage } from "@/lib/asset-display";

export type MaintenanceView = {
  title: string;
  taxonomyKey: string;
  status: MaintenanceItemStatus;
  remainingLabel: string | null;
  source: string;
};

function statusForRemainder(remainder: number, interval: number): MaintenanceItemStatus {
  if (remainder <= 0) return "OVERDUE";
  if (remainder <= interval * 0.08) return "DUE";
  if (remainder <= interval * 0.2) return "DUE_SOON";
  return "UPCOMING";
}

export function evaluateMaintenance(input: {
  industryKey: string;
  usageValue: number | null | undefined;
  usageUnit: UsageUnit;
  createdAt?: Date;
}): MaintenanceView[] {
  const rules = MAINTENANCE_RULES.filter((rule) => rule.industry === input.industryKey);
  const items: MaintenanceView[] = [];
  for (const rule of rules) {
    if (rule.intervalUnit === "CALENDAR_INTERVAL") {
      const start = input.createdAt ?? new Date();
      const months = rule.intervalValue;
      const due = new Date(start);
      due.setMonth(due.getMonth() + months);
      const daysLeft = Math.round((due.getTime() - Date.now()) / 86400000);
      items.push({
        title: rule.title,
        taxonomyKey: rule.taxonomyKey,
        status: daysLeft < 0 ? "OVERDUE" : daysLeft < 30 ? "DUE_SOON" : "UPCOMING",
        remainingLabel: daysLeft < 0 ? "Past due" : `Due around ${due.toLocaleDateString()}`,
        source: "RULE",
      });
      continue;
    }
    if (input.usageValue == null || rule.intervalUnit !== input.usageUnit) continue;
    const remainder = rule.intervalValue - (input.usageValue % rule.intervalValue);
    const normalized = remainder === rule.intervalValue ? 0 : remainder;
    items.push({
      title: rule.title,
      taxonomyKey: rule.taxonomyKey,
      status: statusForRemainder(normalized, rule.intervalValue),
      remainingLabel: `~${formatUsage(normalized, input.usageUnit)}`,
      source: "RULE",
    });
  }
  return items;
}

export async function syncMaintenanceForAsset(assetId: string) {
  const asset = await prisma.asset.findUniqueOrThrow({
    where: { id: assetId },
    include: { industry: true, recommendedWork: { where: { status: "OPEN" } } },
  });
  const evaluated = evaluateMaintenance({
    industryKey: asset.industry.key,
    usageValue: asset.usageValue,
    usageUnit: asset.usageUnit,
    createdAt: asset.createdAt,
  });
  const fromRecommendations = asset.recommendedWork.map((item) => ({
    title: item.title,
    taxonomyKey: "MAINTENANCE",
    status: "DUE" as MaintenanceItemStatus,
    remainingLabel: "Provider recommendation",
    source: "RECOMMENDATION",
  }));
  const combined = [...evaluated, ...fromRecommendations];
  await prisma.maintenanceItem.deleteMany({ where: { assetId, source: { in: ["RULE", "RECOMMENDATION"] }, isDemoFixture: false } });
  if (combined.length) {
    await prisma.maintenanceItem.createMany({
      data: combined.map((item) => ({
        assetId,
        title: item.title,
        taxonomyKey: item.taxonomyKey,
        status: item.status,
        source: item.source,
        remainingUsage: null,
        notes: item.remainingLabel,
      })),
    });
  }
  return combined;
}

export async function garageMaintenance(ownerId: string) {
  const assets = await prisma.asset.findMany({
    where: { ownerId, status: "ACTIVE" },
    include: { industry: true, vehicle: { include: { make: true, model: true } }, recommendedWork: { where: { status: "OPEN" } } },
  });
  return assets.flatMap((asset) => {
    const items = evaluateMaintenance({
      industryKey: asset.industry.key,
      usageValue: asset.usageValue,
      usageUnit: asset.usageUnit,
      createdAt: asset.createdAt,
    });
    const recs = asset.recommendedWork.map((item) => ({
      title: item.title,
      taxonomyKey: "MAINTENANCE",
      status: "DUE" as MaintenanceItemStatus,
      remainingLabel: "Open recommendation",
      source: "RECOMMENDATION",
    }));
    return [...items, ...recs]
      .filter((item) => item.status !== "UPCOMING")
      .map((item) => ({
        ...item,
        assetId: asset.id,
        assetLabel: asset.vehicle
          ? `${asset.vehicle.year} ${asset.vehicle.make.name} ${asset.vehicle.model.name}`
          : [asset.year, asset.manufacturer, asset.model].filter(Boolean).join(" "),
      }));
  });
}
