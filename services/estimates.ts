import { prisma } from "@/lib/db";
import { transitionJob } from "@/services/jobs";
import { notify } from "@/services/notifications";
import type { EstimateLineCategory, EstimateType } from "@prisma/client";

export async function createEstimate(input: {
  jobId: string;
  mechanicId: string;
  type: EstimateType;
  reason?: string;
  notes?: string;
  lineItems: { category: EstimateLineCategory; description: string; quantity: number; unitCents: number }[];
}) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: input.jobId } });
  if (job.mechanicUserId !== input.mechanicId) throw new Error("Not authorized.");

  const items = input.lineItems.map((item) => ({
    ...item,
    totalCents: Math.round(item.quantity * item.unitCents),
  }));
  const totalCents = items.reduce((sum, item) => sum + item.totalCents, 0);

  if (input.type === "PRIMARY") {
    await prisma.estimate.updateMany({
      where: { jobId: input.jobId, type: "PRIMARY", status: { in: ["DRAFT", "SENT"] } },
      data: { status: "SUPERSEDED" },
    });
  }

  const estimate = await prisma.estimate.create({
    data: {
      jobId: input.jobId,
      mechanicId: input.mechanicId,
      type: input.type,
      status: "SENT",
      reason: input.reason,
      notes: input.notes,
      subtotalCents: totalCents,
      totalCents,
      sentAt: new Date(),
      lineItems: { create: items },
    },
    include: { lineItems: true },
  });

  await prisma.job.update({
    where: { id: input.jobId },
    data: {
      status: "AWAITING_APPROVAL",
      totalCents,
      events: { create: { status: "AWAITING_APPROVAL", note: input.type === "CHANGE_ORDER" ? "Additional work requested." : "Estimate sent." } },
    },
  });

  await notify({
    userId: job.customerId,
    title: input.type === "CHANGE_ORDER" ? "Additional work needs your approval" : "Your estimate is ready",
    body: `Review the ${input.type === "CHANGE_ORDER" ? "additional work request" : "estimate"} before work continues.`,
    href: `/jobs/${job.id}`,
  });

  return estimate;
}

export async function respondToEstimate(input: {
  estimateId: string;
  userId: string;
  action: "APPROVED" | "DECLINED";
  ipAddress?: string;
  userAgent?: string;
  note?: string;
}) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { id: input.estimateId },
    include: { job: true },
  });
  if (estimate.job.customerId !== input.userId) throw new Error("Not authorized.");
  if (estimate.status !== "SENT") throw new Error("This estimate is no longer awaiting a decision.");

  await prisma.$transaction([
    prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: input.action === "APPROVED" ? "APPROVED" : "DECLINED" },
    }),
    prisma.estimateApproval.create({
      data: {
        estimateId: estimate.id,
        userId: input.userId,
        action: input.action,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        note: input.note,
      },
    }),
  ]);

  if (input.action === "APPROVED") {
    await prisma.job.update({
      where: { id: estimate.jobId },
      data: { totalCents: estimate.totalCents },
    });
    await transitionJob(estimate.jobId, "IN_PROGRESS", input.userId, "Customer approved the estimate.");
  } else {
    await notify({
      userId: estimate.job.mechanicUserId,
      title: "Estimate declined",
      body: "The customer declined this estimate. Message them if you can revise it.",
      href: `/mechanic/jobs/${estimate.jobId}`,
    });
  }

  return estimate.id;
}
