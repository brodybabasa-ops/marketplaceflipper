"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RepairOutcomeKind, ScheduleBlockKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/session";
import { DEMO_PASSWORD } from "@/lib/constants";
import { isDevPreviewEnabled } from "@/lib/vision";
import { findUserByEmail, verifyPassword } from "@/services/auth";
import { recordRepairOutcome } from "@/services/outcomes";
import { createWarrantyFromRepair } from "@/services/warranties";
import { transferAsset } from "@/services/asset-lifecycle";
import { createScheduleBlock, moveScheduleBlock } from "@/services/scheduler";
import { createServiceRequest } from "@/services/jobs";
import { serviceRequestSchema } from "@/lib/validations";
import { operatingModelFromForm } from "@/lib/operating-model";
import { homeForRole } from "@/lib/session-token";

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function submitOutcomeAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  await recordRepairOutcome({
    jobId,
    customerId: session.id,
    resolved: String(formData.get("resolved")) as RepairOutcomeKind,
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/history");
}

export async function saveWarrantyAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const expires = formData.get("expiresAt") ? new Date(String(formData.get("expiresAt"))) : null;
  await createWarrantyFromRepair({
    jobId,
    actorId: session.id,
    title: String(formData.get("title")),
    partsCoverage: String(formData.get("partsCoverage") ?? "") || undefined,
    laborCoverage: String(formData.get("laborCoverage") ?? "") || undefined,
    expiresAt: expires && !Number.isNaN(expires.getTime()) ? expires : null,
    exclusions: String(formData.get("exclusions") ?? "") || undefined,
  });
  revalidatePath(`/mechanic/jobs/${jobId}`);
}

export async function transferAssetAction(formData: FormData) {
  const session = await requireUser();
  const assetId = String(formData.get("assetId"));
  await transferAsset({
    assetId,
    fromOwnerId: session.id,
    toEmail: String(formData.get("toEmail")),
    includeHistory: formData.get("includeHistory") === "on",
  });
  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function setPreferredProviderAction(formData: FormData) {
  const session = await requireUser();
  const assetId = String(formData.get("assetId"));
  const mechanicProfileId = String(formData.get("mechanicProfileId"));
  const asset = await prisma.asset.findFirst({ where: { id: assetId, ownerId: session.id } });
  if (!asset) throw new Error("Asset not found.");
  await prisma.assetPreferredProvider.upsert({
    where: { assetId_mechanicProfileId_taxonomyKey: { assetId, mechanicProfileId, taxonomyKey: "" } },
    update: {},
    create: { assetId, mechanicProfileId, taxonomyKey: "" },
  });
  revalidatePath(`/vehicles/${asset.vehicleId ?? asset.id}`);
}

export async function createScheduleBlockAction(formData: FormData) {
  const session = await requireUser();
  const profile = await prisma.mechanicProfile.findUnique({ where: { userId: session.id } });
  if (!profile) throw new Error("Not a provider.");
  const startsAt = new Date(String(formData.get("startsAt")));
  const endsAt = new Date(String(formData.get("endsAt")));
  await createScheduleBlock({
    mechanicProfileId: profile.id,
    actorId: session.id,
    jobId: String(formData.get("jobId") || "") || undefined,
    technicianProfileId: String(formData.get("technicianProfileId") || "") || undefined,
    resourceId: String(formData.get("resourceId") || "") || undefined,
    kind: (String(formData.get("kind") || "WORK") as ScheduleBlockKind) || "WORK",
    title: String(formData.get("title") || "Work"),
    startsAt,
    endsAt,
    overrideReason: String(formData.get("overrideReason") || "") || undefined,
  });
  revalidatePath("/mechanic/schedule");
}

export async function moveScheduleBlockAction(formData: FormData) {
  const session = await requireUser();
  await moveScheduleBlock({
    blockId: String(formData.get("blockId")),
    actorId: session.id,
    startsAt: new Date(String(formData.get("startsAt"))),
    endsAt: new Date(String(formData.get("endsAt"))),
    technicianProfileId: String(formData.get("technicianProfileId") || "") || undefined,
    resourceId: String(formData.get("resourceId") || "") || undefined,
    overrideReason: String(formData.get("overrideReason") || "") || undefined,
  });
  revalidatePath("/mechanic/schedule");
}

export async function saveOperatingModelAction(formData: FormData) {
  const session = await requireUser();
  const profile = await prisma.mechanicProfile.findUnique({ where: { userId: session.id } });
  if (!profile) throw new Error("Not a provider.");
  const shop = formData.get("shop") === "on";
  const travel = formData.get("travel") === "on";
  await prisma.mechanicProfile.update({
    where: { id: profile.id },
    data: { operatingModel: operatingModelFromForm(shop, travel) },
  });
  revalidatePath("/mechanic/settings");
  revalidatePath("/mechanic/schedule");
}

export async function createRoadsideAction(formData: FormData) {
  const session = await requireUser();
  await prisma.roadsideRequest.create({
    data: {
      customerId: session.id,
      assetId: String(formData.get("assetId") || "") || undefined,
      kind: (String(formData.get("kind") || "EMERGENCY") as "TOW" | "JUMP" | "TIRE" | "LOCKOUT" | "FUEL" | "MOBILE_DIAGNOSIS" | "EMERGENCY"),
      notes: String(formData.get("notes") || "") || undefined,
      zip: String(formData.get("zip") || "") || undefined,
    },
  });
  const parsed = serviceRequestSchema.safeParse({
    assetId: formData.get("assetId") || undefined,
    problemText: String(formData.get("notes") || "I need urgent help with this asset."),
    zip: String(formData.get("zip") || "84101"),
    requestKind: "ROADSIDE",
    mobilePreferred: true,
  });
  if (parsed.success) {
    const result = await createServiceRequest({
      customerId: session.id,
      ...parsed.data,
      requestKind: "ROADSIDE",
    });
    redirect(result.job ? `/jobs/${result.job.id}` : `/mechanics?request=${result.request.id}&zip=${parsed.data.zip}`);
  }
  redirect("/help-now");
}

export async function previewDemoAccountAction(formData: FormData) {
  if (!isDevPreviewEnabled()) throw new Error("Demo preview is disabled.");
  const email = String(formData.get("email"));
  const user = await findUserByEmail(email);
  if (!user || user.status !== "ACTIVE") throw new Error("Unknown demo account.");
  const valid = await verifyPassword(DEMO_PASSWORD, user.passwordHash);
  if (!valid) throw new Error("Demo password mismatch.");
  await setSessionCookie({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  redirect(homeForRole(user.role));
}
