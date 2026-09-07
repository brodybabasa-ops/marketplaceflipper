import type { UsageUnit } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export async function createWarrantyFromRepair(input: {
  jobId: string;
  actorId: string;
  title: string;
  partsCoverage?: string;
  laborCoverage?: string;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  usageUnit?: UsageUnit | null;
  exclusions?: string;
}) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: input.jobId },
    include: { mechanicProfile: true, repairRecord: true },
  });
  if (job.mechanicUserId !== input.actorId) throw new Error("Not authorized.");

  const warranty = await prisma.repairWarranty.create({
    data: {
      jobId: job.id,
      repairRecordId: job.repairRecord?.id,
      assetId: job.assetId,
      mechanicProfileId: job.mechanicProfileId,
      title: input.title,
      partsCoverage: input.partsCoverage,
      laborCoverage: input.laborCoverage,
      providerName: job.mechanicProfile.businessName,
      expiresAt: input.expiresAt ?? undefined,
      usageLimit: input.usageLimit ?? undefined,
      usageUnit: input.usageUnit ?? undefined,
      exclusions: input.exclusions,
      isDemoFixture: false,
    },
  });
  await audit({
    actorId: input.actorId,
    action: "WARRANTY_CREATED",
    targetType: "RepairWarranty",
    targetId: warranty.id,
    metadata: { jobId: job.id },
  });
  return warranty;
}

export async function warrantiesForAsset(assetId: string) {
  return prisma.repairWarranty.findMany({
    where: { assetId },
    include: { job: { include: { mechanicProfile: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function expiringWarranties(ownerId: string, withinDays = 45) {
  const soon = new Date();
  soon.setDate(soon.getDate() + withinDays);
  return prisma.repairWarranty.findMany({
    where: {
      asset: { ownerId },
      expiresAt: { lte: soon, gte: new Date() },
    },
    include: { asset: { include: { industry: true, vehicle: { include: { make: true, model: true } } } } },
  });
}
