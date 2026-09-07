import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { VerificationPipelineStatus } from "@prisma/client";

const SHOP_CATEGORIES = [
  "Facility condition",
  "Facility organization",
  "Repair equipment",
  "Diagnostic equipment",
  "Technician experience",
  "Credentials",
  "Business legitimacy",
  "Customer process",
  "Estimate practices",
  "Authorization practices",
  "Repair documentation",
  "Quality-control process",
  "Insurance documentation",
  "Vehicle security",
  "Safety practices",
  "Professionalism",
];

const MOBILE_CATEGORIES = [
  "Service vehicle",
  "Tool organization",
  "Tool inventory",
  "Diagnostics",
  "Specialty equipment",
  "Safety equipment",
  "Experience",
  "Credentials",
  "Insurance",
  "Advertised services",
  "Estimate practices",
  "Authorization",
  "Documentation",
  "Cleanup / waste handling",
  "Customer communication",
  "Warranty process",
  "Professionalism",
];

export function checklistFor(kind: "SHOP" | "MOBILE") {
  return kind === "SHOP" ? SHOP_CATEGORIES : MOBILE_CATEGORIES;
}

export async function applyForVerification(mechanicUserId: string, kind: "SHOP" | "MOBILE") {
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: mechanicUserId } });
  const existing = await prisma.verificationApplication.findFirst({
    where: { mechanicProfileId: profile.id, status: { notIn: ["DENIED", "EXPIRED", "REVOKED"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.status !== "VERIFIED") return existing;
  const application = await prisma.verificationApplication.create({
    data: {
      mechanicProfileId: profile.id,
      kind,
      status: "APPLICATION_RECEIVED",
      events: { create: { toStatus: "APPLICATION_RECEIVED", reason: "Provider applied for in-person evaluation." } },
    },
  });
  await prisma.mechanicProfile.update({
    where: { id: profile.id },
    data: { verificationPipeline: "APPLICATION_RECEIVED" },
  });
  await audit({
    actorId: mechanicUserId,
    action: "verification.applied",
    targetType: "mechanic",
    targetId: profile.id,
  });
  return application;
}

const PUBLIC_VERIFIED_GONE = new Set<VerificationPipelineStatus>(["DENIED", "EXPIRED", "SUSPENDED", "REVOKED"]);

export async function setVerificationStatus(input: {
  applicationId: string;
  actorId: string;
  status: VerificationPipelineStatus;
  reason?: string;
  inspectorId?: string;
  scheduledAt?: Date;
}) {
  const application = await prisma.verificationApplication.findUniqueOrThrow({
    where: { id: input.applicationId },
  });
  await prisma.verificationApplication.update({
    where: { id: application.id },
    data: {
      status: input.status,
      events: { create: { actorId: input.actorId, fromStatus: application.status, toStatus: input.status, reason: input.reason } },
    },
  });

  if (input.status === "VISIT_SCHEDULED") {
    const existing = await prisma.verificationInspection.findFirst({ where: { applicationId: application.id } });
    if (!existing) {
      await prisma.verificationInspection.create({
        data: {
          applicationId: application.id,
          mechanicProfileId: application.mechanicProfileId,
          inspectorId: input.inspectorId,
          kind: application.kind,
          scheduledAt: input.scheduledAt ?? new Date(),
          status: "VISIT_SCHEDULED",
          items: {
            create: checklistFor(application.kind).map((category) => ({ category })),
          },
        },
      });
    }
  }

  const verified = input.status === "VERIFIED";
  await prisma.mechanicProfile.update({
    where: { id: application.mechanicProfileId },
    data: {
      verificationPipeline: input.status,
      verificationLevel: verified ? "POCKET_VERIFIED" : PUBLIC_VERIFIED_GONE.has(input.status) ? "PROFILE_VERIFIED" : undefined,
      lastVerifiedAt: verified ? new Date() : undefined,
    },
  });
  await audit({
    actorId: input.actorId,
    action: `verification.${input.status.toLowerCase()}`,
    targetType: "verificationApplication",
    targetId: application.id,
    reason: input.reason,
  });
}

export async function saveInspectionItem(input: {
  itemId: string;
  actorId: string;
  score?: number;
  passed?: boolean;
  notes?: string;
  notApplicable?: boolean;
}) {
  const item = await prisma.verificationChecklistItem.update({
    where: { id: input.itemId },
    data: {
      score: input.score,
      passed: input.passed,
      notes: input.notes,
      notApplicable: input.notApplicable ?? false,
    },
    include: { inspection: true },
  });
  await audit({
    actorId: input.actorId,
    action: "verification.checklist.updated",
    targetType: "verificationInspection",
    targetId: item.inspectionId,
    metadata: { category: item.category, score: input.score, passed: input.passed },
  });
  return item;
}
