import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { ALLOWED_JOB_TRANSITIONS } from "@/services/mechanics";
import { transitionJob } from "@/services/jobs";
import { notify } from "@/services/notifications";
import type { EstimateLineCategory, EstimateType, JobStatus } from "@prisma/client";

async function postJobNote(jobId: string, senderId: string, body: string) {
  const thread = await prisma.messageThread.findUnique({ where: { jobId } });
  if (!thread) return;
  await prisma.message.create({
    data: { threadId: thread.id, senderId, body },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date() },
  });
}

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
  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    throw new Error("This job cannot take a new estimate.");
  }
  if (job.status !== "AWAITING_APPROVAL" && !ALLOWED_JOB_TRANSITIONS[job.status].includes("AWAITING_APPROVAL")) {
    throw new Error("This job cannot take an estimate right now.");
  }

  const items = input.lineItems.map((item) => ({
    ...item,
    totalCents: Math.round(item.quantity * item.unitCents),
  }));
  const totalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const note = input.type === "CHANGE_ORDER" ? "Additional work requested." : "Estimate sent.";

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
    data: { totalCents },
  });

  if (job.status !== "AWAITING_APPROVAL") {
    await transitionJob(input.jobId, "AWAITING_APPROVAL", input.mechanicId, note);
  } else {
    await prisma.job.update({
      where: { id: input.jobId },
      data: { events: { create: { status: "AWAITING_APPROVAL", note } } },
    });
  }

  await prisma.serviceRequest.update({
    where: { id: job.serviceRequestId },
    data: { status: "ACCEPTED", mechanicProfileId: job.mechanicProfileId },
  });

  await postJobNote(job.id, input.mechanicId, `${note} ${formatCents(totalCents)}. Waiting on your approval.`);
  await notify({
    userId: job.customerId,
    title: input.type === "CHANGE_ORDER" ? "Additional work needs your approval" : "Your estimate is ready",
    body: `Review the ${input.type === "CHANGE_ORDER" ? "additional work request" : "estimate"} before work continues.`,
    href: `/jobs/${job.id}#estimate`,
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
    include: { job: { include: { customer: true } } },
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

  const customerName = `${estimate.job.customer.firstName} ${estimate.job.customer.lastName}`.trim();

  if (input.action === "APPROVED") {
    await prisma.job.update({
      where: { id: estimate.jobId },
      data: { totalCents: estimate.totalCents },
    });
    if (estimate.job.status === "AWAITING_APPROVAL") {
      await transitionJob(estimate.jobId, "IN_PROGRESS", input.userId, "Customer approved the estimate.");
    }
    await postJobNote(estimate.jobId, input.userId, `Approved the estimate (${formatCents(estimate.totalCents)}).`);
    await notify({
      userId: estimate.job.mechanicUserId,
      title: "Estimate approved",
      body: `${customerName} approved ${formatCents(estimate.totalCents)}. The job is in progress.`,
      href: `/mechanic/jobs/${estimate.jobId}`,
    });
  } else {
    const next = await statusAfterDecline(estimate.jobId, estimate.job.status, Boolean(estimate.job.scheduledAt));
    if (next && next !== estimate.job.status) {
      await transitionJob(estimate.jobId, next, input.userId, "Customer declined the estimate.");
    }
    await postJobNote(estimate.jobId, input.userId, "Declined the estimate.");
    await notify({
      userId: estimate.job.mechanicUserId,
      title: "Estimate declined",
      body: `${customerName} declined this estimate. Send a revision if you can.`,
      href: `/mechanic/jobs/${estimate.jobId}`,
    });
  }

  return estimate.id;
}

async function statusAfterDecline(jobId: string, current: JobStatus, scheduled: boolean): Promise<JobStatus | null> {
  if (current !== "AWAITING_APPROVAL") return null;
  const approved = await prisma.estimate.findFirst({
    where: { jobId, status: "APPROVED" },
    select: { id: true },
  });
  if (approved) return "IN_PROGRESS";
  if (scheduled) return "SCHEDULED";
  return "DIAGNOSING";
}
