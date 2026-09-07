"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guards";
import type { AccountStatus, VerificationLevel, VerificationStatus } from "@prisma/client";
import { refreshMechanicScore } from "@/services/mechanics";

export async function setAccountStatusAction(formData: FormData) {
  const admin = await requireSession("ADMIN");
  const userId = String(formData.get("userId"));
  const status = String(formData.get("status")) as AccountStatus;
  await prisma.user.update({ where: { id: userId }, data: { status } });
  await prisma.adminAction.create({
    data: { adminId: admin.id, action: `set_status_${status}`, targetType: "User", targetId: userId },
  });
  revalidatePath("/admin/users");
}

export async function reviewVerificationAction(formData: FormData) {
  const admin = await requireSession("ADMIN");
  const id = String(formData.get("verificationId"));
  const status = String(formData.get("status")) as VerificationStatus;
  const verification = await prisma.verification.update({
    where: { id },
    data: { status, reviewedById: admin.id, reviewedAt: new Date() },
  });
  if (status === "APPROVED") {
    await prisma.mechanicProfile.update({
      where: { id: verification.mechanicProfileId },
      data: { verificationLevel: verification.level as VerificationLevel },
    });
    await refreshMechanicScore(verification.mechanicProfileId);
  }
  await prisma.adminAction.create({
    data: { adminId: admin.id, action: `verification_${status}`, targetType: "Verification", targetId: id },
  });
  revalidatePath("/admin/verification");
}

export async function hideReviewAction(formData: FormData) {
  const admin = await requireSession("ADMIN");
  const id = String(formData.get("reviewId"));
  await prisma.review.update({ where: { id }, data: { hidden: true, flagged: true } });
  await prisma.adminAction.create({
    data: { adminId: admin.id, action: "hide_review", targetType: "Review", targetId: id },
  });
  revalidatePath("/admin/reviews");
}

export async function resolveDisputeAction(formData: FormData) {
  const admin = await requireSession("ADMIN");
  const id = String(formData.get("disputeId"));
  await prisma.dispute.update({
    where: { id },
    data: { status: "RESOLVED", resolution: String(formData.get("resolution") ?? "Resolved by admin") },
  });
  await prisma.adminAction.create({
    data: { adminId: admin.id, action: "resolve_dispute", targetType: "Dispute", targetId: id },
  });
  revalidatePath("/admin/disputes");
}
