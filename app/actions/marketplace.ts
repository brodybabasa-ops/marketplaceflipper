"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createAutomotiveAsset, createGenericAsset } from "@/services/assets";
import type { IndustryKey } from "@/lib/catalog";
import {
  disputeSchema,
  estimateSchema,
  genericAssetSchema,
  messageSchema,
  reviewSchema,
  serviceRequestSchema,
  vehicleSchema,
} from "@/lib/validations";
import { assignMechanicToRequest, createServiceRequest, getJobForUser, transitionJob } from "@/services/jobs";
import { syncAssetUsage } from "@/services/assets";
import { audit } from "@/lib/audit";
import { createEstimate, respondToEstimate } from "@/services/estimates";
import { createReview } from "@/services/reviews";
import { notifyUser } from "@/services/notifications";
import type { JobStatus } from "@prisma/client";

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function createVehicleAction(formData: FormData) {
  const session = await requireUser();
  const parsed = vehicleSchema.safeParse({
    year: formData.get("year"),
    makeId: formData.get("makeId"),
    modelId: formData.get("modelId"),
    trim: formData.get("trim") || undefined,
    engine: formData.get("engine") || undefined,
    drivetrain: formData.get("drivetrain") || undefined,
    mileage: formData.get("mileage"),
    vin: formData.get("vin") || undefined,
    plate: formData.get("plate") || undefined,
    color: formData.get("color") || undefined,
    nickname: formData.get("nickname") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error("Check your vehicle details.");
  const vehicle = await prisma.vehicle.create({ data: { ...parsed.data, customerId: session.id } });
  const make = await prisma.vehicleMake.findUniqueOrThrow({ where: { id: vehicle.makeId } });
  const model = await prisma.vehicleModel.findUniqueOrThrow({ where: { id: vehicle.modelId } });
  await createAutomotiveAsset({
    id: vehicle.id,
    customerId: session.id,
    year: vehicle.year,
    mileage: vehicle.mileage,
    vin: vehicle.vin,
    plate: vehicle.plate,
    trim: vehicle.trim,
    nickname: vehicle.nickname,
    photoUrl: vehicle.photoUrl,
    makeName: make.name,
    modelName: model.name,
  });
  revalidatePath("/vehicles");
  revalidatePath("/home");
  redirect(`/vehicles`);
}

export async function createGenericAssetAction(formData: FormData) {
  const session = await requireUser();
  const parsed = genericAssetSchema.safeParse({
    industryKey: formData.get("industryKey"),
    assetTypeKey: formData.get("assetTypeKey"),
    year: formData.get("year") || undefined,
    manufacturer: formData.get("manufacturer"),
    model: formData.get("model"),
    nickname: formData.get("nickname") || undefined,
    usageValue: formData.get("usageValue") || undefined,
    serial: formData.get("serial") || undefined,
  });
  if (!parsed.success) throw new Error("Check the equipment details.");
  await createGenericAsset({
    ownerId: session.id,
    industryKey: parsed.data.industryKey as IndustryKey,
    assetTypeKey: parsed.data.assetTypeKey,
    year: parsed.data.year,
    manufacturer: parsed.data.manufacturer,
    model: parsed.data.model,
    nickname: parsed.data.nickname,
    usageValue: parsed.data.usageValue,
    identifiers: parsed.data.serial ? [{ kind: "SERIAL_NUMBER", value: parsed.data.serial }] : undefined,
  });
  revalidatePath("/vehicles");
  revalidatePath("/home");
  redirect("/vehicles");
}

export async function createRequestAction(formData: FormData) {
  const session = await requireUser();
  const parsed = serviceRequestSchema.safeParse({
    vehicleId: formData.get("vehicleId") || undefined,
    assetId: formData.get("assetId") || undefined,
    problemText: formData.get("problemText"),
    description: formData.get("description") || undefined,
    zip: formData.get("zip"),
    preferredDate: formData.get("preferredDate") || undefined,
    preferredTimeWindow: formData.get("preferredTimeWindow") || undefined,
    budgetCents: formData.get("budgetCents") || undefined,
    mobilePreferred: formData.get("mobilePreferred") === "on",
    mechanicProfileId: formData.get("mechanicProfileId") || undefined,
    whenItHappens: formData.get("whenItHappens") || undefined,
    startedWhen: formData.get("startedWhen") || undefined,
    warningLights: formData.get("warningLights") || undefined,
    drivability: formData.get("drivability") || undefined,
    requestKind: formData.get("prePurchase") === "on" ? "PRE_PURCHASE" : formData.get("requestKind") || "REPAIR",
    urgencyMode: formData.get("urgencyMode") || "NORMAL",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check your request.");
  const result = await createServiceRequest({
    customerId: session.id,
    ...parsed.data,
  });
  if (result.job) {
    redirect(`/jobs/${result.job.id}`);
  }
  redirect(`/mechanics?request=${result.request.id}&zip=${parsed.data.zip}`);
}

export async function assignMechanicToRequestAction(formData: FormData) {
  const session = await requireUser();
  if (session.role !== "CUSTOMER") throw new Error("Not authorized.");
  const result = await assignMechanicToRequest({
    requestId: String(formData.get("requestId")),
    mechanicProfileId: String(formData.get("mechanicProfileId")),
    customerId: session.id,
  });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${result.job.id}`);
  revalidatePath("/mechanic/requests");
  redirect(`/jobs/${result.job.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const session = await requireUser();
  const parsed = messageSchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) throw new Error("Message cannot be empty.");
  const thread = await prisma.messageThread.findUniqueOrThrow({ where: { id: parsed.data.threadId } });
  if (thread.customerId !== session.id && thread.mechanicId !== session.id) {
    throw new Error("Not authorized.");
  }
  await prisma.message.create({
    data: { threadId: thread.id, senderId: session.id, body: parsed.data.body },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date() },
  });
  const recipientId = session.id === thread.customerId ? thread.mechanicId : thread.customerId;
  await notifyUser({
    userId: recipientId,
    title: "New message",
    body: parsed.data.body.slice(0, 120),
    href: thread.jobId ? `/jobs/${thread.jobId}` : "/messages",
  });
  revalidatePath("/messages");
  if (thread.jobId) {
    revalidatePath(`/jobs/${thread.jobId}`);
    revalidatePath(`/mechanic/jobs/${thread.jobId}`);
  }
}

export async function createEstimateAction(formData: FormData) {
  const session = await requireUser();
  const rawItems = formData.getAll("itemDescription");
  const lineItems = rawItems.map((_, index) => ({
    category: formData.getAll("itemCategory")[index],
    description: formData.getAll("itemDescription")[index],
    quantity: formData.getAll("itemQuantity")[index],
    unitCents: Math.round(Number(formData.getAll("itemUnit")[index]) * 100),
  }));
  const parsed = estimateSchema.safeParse({
    jobId: formData.get("jobId"),
    type: formData.get("type") ?? "PRIMARY",
    reason: formData.get("reason") || undefined,
    notes: formData.get("notes") || undefined,
    lineItems,
  });
  if (!parsed.success) throw new Error("Add complete line items before sending.");
  const estimate = await createEstimate({ ...parsed.data, mechanicId: session.id });
  revalidatePath(`/mechanic/jobs/${parsed.data.jobId}`);
  redirect(`/mechanic/jobs/${parsed.data.jobId}?estimate=${estimate.id}`);
}

export async function estimateDecisionAction(formData: FormData) {
  const session = await requireUser();
  const headerStore = await headers();
  await respondToEstimate({
    estimateId: String(formData.get("estimateId")),
    userId: session.id,
    action: formData.get("action") === "DECLINED" ? "DECLINED" : "APPROVED",
    ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0] ?? undefined,
    userAgent: headerStore.get("user-agent") ?? undefined,
  });
  const estimate = await prisma.estimate.findUniqueOrThrow({ where: { id: String(formData.get("estimateId")) } });
  revalidatePath(`/jobs/${estimate.jobId}`);
}

export async function updateJobStatusAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const status = String(formData.get("status")) as JobStatus;
  const job = await getJobForUser(jobId, session.id, session.role);
  if (!job) throw new Error("Job not found.");
  await transitionJob(jobId, status, session.id, String(formData.get("note") ?? "") || undefined);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/mechanic/jobs/${jobId}`);
}

export async function createReviewAction(formData: FormData) {
  const session = await requireUser();
  const parsed = reviewSchema.safeParse({
    jobId: formData.get("jobId"),
    overallRating: formData.get("overallRating"),
    communicationRating: formData.get("communicationRating"),
    professionalismRating: formData.get("professionalismRating"),
    pricingRating: formData.get("pricingRating"),
    timelinessRating: formData.get("timelinessRating"),
    qualityRating: formData.get("qualityRating"),
    wouldUseAgain: formData.get("wouldUseAgain") === "yes",
    body: formData.get("body"),
  });
  if (!parsed.success) throw new Error("Complete the review before submitting.");
  await createReview({ ...parsed.data, customerId: session.id });
  revalidatePath(`/jobs/${parsed.data.jobId}`);
  redirect(`/jobs/${parsed.data.jobId}`);
}

export async function createDisputeAction(formData: FormData) {
  const session = await requireUser();
  const parsed = disputeSchema.safeParse({
    jobId: formData.get("jobId"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!parsed.success) throw new Error("Tell us what went wrong.");
  const job = await getJobForUser(parsed.data.jobId, session.id, session.role);
  if (!job) throw new Error("Job not found.");
  await prisma.dispute.create({
    data: {
      jobId: job.id,
      customerId: job.customerId,
      mechanicId: job.mechanicUserId,
      category: parsed.data.category,
      description: parsed.data.description,
    },
  });
  await prisma.job.update({ where: { id: job.id }, data: { status: "DISPUTED" } });
  await notifyUser({
    userId: job.mechanicUserId,
    title: "A customer reported a problem",
    body: parsed.data.description.slice(0, 160),
    href: `/mechanic/jobs/${job.id}`,
  });
  revalidatePath(`/jobs/${job.id}`);
  revalidatePath("/disputes");
  redirect(`/disputes`);
}

export async function saveRepairRecordAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const job = await getJobForUser(jobId, session.id, session.role);
  if (!job || job.mechanicUserId !== session.id) throw new Error("Not authorized.");
  const record = await prisma.repairRecord.upsert({
    where: { jobId },
    update: {
      title: String(formData.get("title")),
      diagnosis: String(formData.get("diagnosis") ?? ""),
      workPerformed: String(formData.get("workPerformed") ?? ""),
      partsReplaced: String(formData.get("partsReplaced") ?? ""),
      partNumbers: String(formData.get("partNumbers") ?? ""),
      laborHours: formData.get("laborHours") ? Number(formData.get("laborHours")) : undefined,
      mileage: formData.get("mileage") ? Number(formData.get("mileage")) : undefined,
      warrantySummary: String(formData.get("warrantySummary") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    },
    create: {
      jobId,
      vehicleId: job.vehicleId,
      assetId: job.assetId,
      title: String(formData.get("title")),
      diagnosis: String(formData.get("diagnosis") ?? ""),
      workPerformed: String(formData.get("workPerformed") ?? ""),
      partsReplaced: String(formData.get("partsReplaced") ?? ""),
      partNumbers: String(formData.get("partNumbers") ?? ""),
      laborHours: formData.get("laborHours") ? Number(formData.get("laborHours")) : undefined,
      mileage: formData.get("mileage") ? Number(formData.get("mileage")) : undefined,
      warrantySummary: String(formData.get("warrantySummary") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    },
  });
  const mileage = formData.get("mileage") ? Number(formData.get("mileage")) : undefined;
  if (mileage != null && Number.isFinite(mileage)) {
    await syncAssetUsage({ assetId: job.assetId, vehicleId: job.vehicleId, usageValue: mileage });
  }
  const warrantySummary = String(formData.get("warrantySummary") ?? "").trim();
  await audit({
    actorId: session.id,
    action: "repair.documented",
    targetType: "job",
    targetId: jobId,
    metadata: { title: record.title, warranty: Boolean(warrantySummary) },
  });
  if (warrantySummary) {
    const existing = await prisma.repairWarranty.findFirst({ where: { jobId } });
    if (existing) {
      await prisma.repairWarranty.update({
        where: { id: existing.id },
        data: { title: record.title, laborCoverage: warrantySummary },
      });
    } else {
      await prisma.repairWarranty.create({
        data: {
          jobId,
          repairRecordId: record.id,
          assetId: job.assetId,
          mechanicProfileId: job.mechanicProfileId,
          title: record.title,
          laborCoverage: warrantySummary,
          providerName: job.mechanicProfile.businessName,
        },
      });
    }
  }
  revalidatePath(`/mechanic/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}`);
}
