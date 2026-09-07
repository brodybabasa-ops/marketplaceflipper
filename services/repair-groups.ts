import { prisma } from "@/lib/db";
import { notifyUser } from "@/services/notifications";
import { audit } from "@/lib/audit";
import type { ApprovalAction, EstimateLineCategory } from "@prisma/client";

export async function createGroupedEstimate(input: {
  jobId: string;
  mechanicId: string;
  type?: "PRIMARY" | "CHANGE_ORDER";
  reason?: string;
  groups: {
    title: string;
    recommendation?: string;
    items: { category: EstimateLineCategory; description: string; quantity: number; unitCents: number }[];
  }[];
}) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: input.jobId } });
  if (job.mechanicUserId !== input.mechanicId) throw new Error("Not authorized.");

  const prepared = input.groups.map((group, index) => {
    const items = group.items.map((item) => ({
      ...item,
      totalCents: Math.round(item.quantity * item.unitCents),
    }));
    return {
      title: group.title,
      recommendation: group.recommendation ?? "RECOMMENDED",
      sortOrder: index,
      totalCents: items.reduce((sum, item) => sum + item.totalCents, 0),
      items,
    };
  });
  const totalCents = prepared.reduce((sum, group) => sum + group.totalCents, 0);

  if ((input.type ?? "PRIMARY") === "PRIMARY") {
    await prisma.estimate.updateMany({
      where: { jobId: input.jobId, type: "PRIMARY", status: { in: ["DRAFT", "SENT"] } },
      data: { status: "SUPERSEDED" },
    });
  }

  const estimate = await prisma.estimate.create({
    data: {
      jobId: input.jobId,
      mechanicId: input.mechanicId,
      type: input.type ?? "PRIMARY",
      status: "SENT",
      reason: input.reason,
      subtotalCents: totalCents,
      totalCents,
      sentAt: new Date(),
    },
  });

  for (const group of prepared) {
    const created = await prisma.repairGroup.create({
      data: {
        estimateId: estimate.id,
        jobId: input.jobId,
        title: group.title,
        recommendation: group.recommendation,
        totalCents: group.totalCents,
        sortOrder: group.sortOrder,
      },
    });
    await prisma.estimateLineItem.createMany({
      data: group.items.map((item) => ({
        estimateId: estimate.id,
        repairGroupId: created.id,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unitCents: item.unitCents,
        totalCents: item.totalCents,
      })),
    });
  }

  await prisma.job.update({
    where: { id: input.jobId },
    data: {
      status: "AWAITING_APPROVAL",
      totalCents,
      events: {
        create: {
          status: "AWAITING_APPROVAL",
          note: input.type === "CHANGE_ORDER" ? "Supplemental estimate sent." : "Estimate sent.",
        },
      },
    },
  });

  await notifyUser({
    userId: job.customerId,
    title: input.type === "CHANGE_ORDER" ? "Additional work needs your approval" : "Choose the repairs you'd like completed",
    body: "Approve or decline each repair. Only approved work is authorized.",
    href: `/jobs/${job.id}`,
  });

  return estimate;
}

export function totalsForGroups(groups: { status: string; totalCents: number }[]) {
  const originalCents = groups.reduce((sum, group) => sum + group.totalCents, 0);
  const approvedCents = groups.filter((group) => group.status === "APPROVED").reduce((sum, group) => sum + group.totalCents, 0);
  const declinedCents = groups.filter((group) => group.status === "DECLINED").reduce((sum, group) => sum + group.totalCents, 0);
  const pendingCents = groups.filter((group) => group.status === "PENDING").reduce((sum, group) => sum + group.totalCents, 0);
  return { originalCents, approvedCents, declinedCents, pendingCents, authorizedCents: approvedCents };
}

export async function decideRepairGroup(input: { groupId: string; customerId: string; action: ApprovalAction }) {
  const group = await prisma.repairGroup.findUniqueOrThrow({
    where: { id: input.groupId },
    include: { estimate: { include: { job: true } } },
  });
  if (group.estimate.job.customerId !== input.customerId) throw new Error("Not authorized.");
  if (group.estimate.status !== "SENT") throw new Error("This estimate is no longer awaiting decisions.");
  return prisma.repairGroup.update({
    where: { id: group.id },
    data: { status: input.action === "APPROVED" ? "APPROVED" : "DECLINED" },
  });
}

export async function submitAuthorization(input: { estimateId: string; customerId: string; ipAddress?: string; userAgent?: string }) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { id: input.estimateId },
    include: { job: true, repairGroups: true },
  });
  if (estimate.job.customerId !== input.customerId) throw new Error("Not authorized.");
  if (estimate.status !== "SENT") throw new Error("This estimate is no longer awaiting a decision.");
  if (estimate.repairGroups.some((group) => group.status === "PENDING")) {
    throw new Error("Approve or decline every repair before submitting.");
  }

  const totals = totalsForGroups(estimate.repairGroups);
  const authorization = await prisma.repairAuthorization.create({
    data: {
      estimateId: estimate.id,
      jobId: estimate.jobId,
      customerId: input.customerId,
      originalCents: totals.originalCents,
      approvedCents: totals.approvedCents,
      declinedCents: totals.declinedCents,
      pendingCents: 0,
      authorizedCents: totals.authorizedCents,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      decisions: {
        create: estimate.repairGroups.map((group) => ({
          repairGroupId: group.id,
          action: group.status === "APPROVED" ? "APPROVED" : "DECLINED",
        })),
      },
    },
  });

  await prisma.estimate.update({
    where: { id: estimate.id },
    data: { status: totals.approvedCents > 0 ? "APPROVED" : "DECLINED" },
  });

  const approvedTotal = (estimate.job.totalCents || 0) - (estimate.type === "CHANGE_ORDER" ? 0 : estimate.totalCents) + totals.authorizedCents;
  await prisma.job.update({
    where: { id: estimate.jobId },
    data: {
      totalCents: estimate.type === "CHANGE_ORDER" ? estimate.job.totalCents + totals.authorizedCents : totals.authorizedCents,
      status: totals.authorizedCents > 0 ? "IN_PROGRESS" : estimate.job.status,
      events: {
        create: {
          status: totals.authorizedCents > 0 ? "IN_PROGRESS" : estimate.job.status,
          note: `Authorization submitted. Authorized ${totals.authorizedCents} cents.`,
        },
      },
    },
  });

  for (const group of estimate.repairGroups.filter((item) => item.status === "DECLINED")) {
    await prisma.recommendedWork.create({
      data: {
        customerId: estimate.job.customerId,
        mechanicProfileId: estimate.job.mechanicProfileId,
        vehicleId: estimate.job.vehicleId,
        jobId: estimate.jobId,
        estimateId: estimate.id,
        repairGroupId: group.id,
        title: group.title,
        estimatedCents: group.totalCents,
        declineDate: new Date(),
        followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
        notes: "Declined from estimate. Stays on the vehicle as recommended work.",
      },
    });
  }

  await audit({
    actorId: input.customerId,
    action: "authorization.submitted",
    targetType: "estimate",
    targetId: estimate.id,
    metadata: totals,
  });

  await notifyUser({
    userId: estimate.job.mechanicUserId,
    title: totals.authorizedCents > 0 ? "Estimate partially or fully approved" : "Estimate declined",
    body: `Authorized ${Math.round(totals.authorizedCents / 100)} dollars. Declined work was saved as recommended follow-up.`,
    href: `/mechanic/jobs/${estimate.jobId}`,
  });

  return { authorization, totals, approvedTotal };
}
