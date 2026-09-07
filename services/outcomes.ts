import type { RepairOutcomeKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export async function recordRepairOutcome(input: {
  jobId: string;
  customerId: string;
  resolved: RepairOutcomeKind;
  notes?: string;
  communicationRating?: number;
  professionalismRating?: number;
  timelinessRating?: number;
  pricingRating?: number;
  qualityRating?: number;
  wouldUseAgain?: boolean;
}) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: input.jobId },
    include: { serviceRequest: true, outcome: true },
  });
  if (job.customerId !== input.customerId) throw new Error("Not authorized.");
  if (job.status !== "COMPLETED") throw new Error("Outcomes are collected after the repair is complete.");

  const data = {
    customerId: job.customerId,
    mechanicProfileId: job.mechanicProfileId,
    assetId: job.assetId,
    technicianProfileId: job.technicianProfileId,
    originalProblem: job.serviceRequest.problemText,
    category: job.serviceRequest.category,
    taxonomyKey: job.serviceRequest.taxonomyKey,
    resolved: input.resolved,
    notes: input.notes,
  };

  const outcome = job.outcome
    ? await prisma.repairOutcome.update({ where: { jobId: job.id }, data })
    : await prisma.repairOutcome.create({ data: { jobId: job.id, ...data } });

  await audit({
    actorId: input.customerId,
    action: "REPAIR_OUTCOME",
    targetType: "Job",
    targetId: job.id,
    metadata: { resolved: input.resolved },
  });

  return outcome;
}

export async function outcomeStats(mechanicProfileId: string) {
  const grouped = await prisma.repairOutcome.groupBy({
    by: ["resolved"],
    where: { mechanicProfileId },
    _count: { _all: true },
  });
  const total = grouped.reduce((sum, item) => sum + item._count._all, 0);
  const yes = grouped.find((item) => item.resolved === "YES")?._count._all ?? 0;
  return { total, yes, rate: total ? yes / total : null };
}
