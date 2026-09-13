"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, safeInternalPath } from "@/lib/session";
import {
  disputeSchema,
  estimateSchema,
  messageSchema,
  reviewSchema,
  serviceRequestSchema,
  vehicleSchema,
} from "@/lib/validations";
import { createServiceRequest, createShopRepairOrder, getJobForUser, scheduleJobAppointment, transitionJob } from "@/services/jobs";
import { createEstimate, respondToEstimate } from "@/services/estimates";
import { getOrCreateShopThread, markThreadRead } from "@/services/messages";
import { createReview } from "@/services/reviews";
import { decodeVinToCatalog } from "@/services/vin";
import { savePublicUpload } from "@/lib/uploads";
import type { JobStatus, PhotoKind } from "@prisma/client";

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

function revalidateJobSurfaces(jobId?: string) {
  revalidatePath("/jobs");
  revalidatePath("/home");
  revalidatePath("/messages");
  revalidatePath("/appointments");
  revalidatePath("/estimates");
  revalidatePath("/vehicles");
  revalidatePath("/history");
  revalidatePath("/notifications");
  revalidatePath("/account");
  revalidatePath("/saved");
  revalidatePath("/search");
  revalidatePath("/mechanic");
  revalidatePath("/mechanic/requests");
  revalidatePath("/mechanic/jobs");
  revalidatePath("/mechanic/messages");
  revalidatePath("/mechanic/customers");
  revalidatePath("/mechanic/schedule");
  revalidatePath("/mechanic/estimates");
  revalidatePath("/mechanic/notifications");
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/notifications");
  if (jobId) {
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath(`/mechanic/jobs/${jobId}`);
    revalidatePath(`/admin/jobs/${jobId}`);
  }
}

export async function createVehicleAction(formData: FormData) {
  const session = await requireUser();
  const modelId = String(formData.get("modelId") ?? "");
  const modelLabel = String(formData.get("modelLabel") ?? "").trim().toLowerCase();
  const models = await prisma.vehicleModel.findMany({ include: { make: true } });
  const model =
    models.find((item) => item.id === modelId) ??
    models.find((item) => `${item.make.name} ${item.name}`.toLowerCase() === modelLabel) ??
    models.find((item) => modelLabel.length >= 5 && `${item.make.name} ${item.name}`.toLowerCase().includes(modelLabel));
  if (!model) throw new Error("Pick a make and model.");
  const parsed = vehicleSchema.safeParse({
    year: formData.get("year"),
    makeId: model.makeId,
    modelId: model.id,
    trim: formData.get("trim") || undefined,
    engine: formData.get("engine") || undefined,
    drivetrain: formData.get("drivetrain") || undefined,
    mileage: formData.get("mileage"),
    vin: formData.get("vin") || undefined,
    nickname: formData.get("nickname") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error("Check your vehicle details.");
  await prisma.vehicle.create({ data: { ...parsed.data, customerId: session.id } });
  revalidatePath("/vehicles");
  revalidatePath("/home");
  revalidatePath("/request");
  revalidatePath("/admin/vehicles");
  redirect("/vehicles");
}

export async function updateVehicleAction(formData: FormData) {
  const session = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, customerId: session.id },
  });
  if (!vehicle) throw new Error("Vehicle not found.");
  const modelId = String(formData.get("modelId") ?? vehicle.modelId);
  const model = await prisma.vehicleModel.findUnique({ where: { id: modelId } });
  if (!model) throw new Error("Pick a make and model.");
  const parsed = vehicleSchema.safeParse({
    year: formData.get("year") ?? vehicle.year,
    makeId: model.makeId,
    modelId: model.id,
    trim: formData.get("trim") || undefined,
    engine: formData.get("engine") || undefined,
    drivetrain: formData.get("drivetrain") || undefined,
    mileage: formData.get("mileage") ?? vehicle.mileage,
    vin: formData.get("vin") || undefined,
    nickname: formData.get("nickname") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error("Check your vehicle details.");
  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: parsed.data,
  });
  revalidatePath("/vehicles");
  revalidatePath("/home");
  revalidatePath("/request");
  revalidatePath("/admin/vehicles");
  redirect("/vehicles");
}

export async function archiveVehicleAction(formData: FormData) {
  const session = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, customerId: session.id },
    include: { _count: { select: { jobs: true } } },
  });
  if (!vehicle) throw new Error("Vehicle not found.");
  if (vehicle._count.jobs === 0) {
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
  } else {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { archivedAt: vehicle.archivedAt ? null : new Date() },
    });
  }
  revalidatePath("/vehicles");
  revalidatePath("/home");
  revalidatePath("/request");
  revalidatePath("/admin/vehicles");
  redirect("/vehicles");
}

export async function decodeVinAction(formData: FormData) {
  await requireUser();
  const vin = String(formData.get("vin") ?? "");
  const decoded = await decodeVinToCatalog(vin);
  const params = new URLSearchParams();
  params.set("vin", decoded.vin);
  if (decoded.year) params.set("year", String(decoded.year));
  if (decoded.modelId) params.set("modelId", decoded.modelId);
  if (decoded.makeName) params.set("make", decoded.makeName);
  if (decoded.modelName) params.set("model", decoded.modelName);
  if (decoded.error) params.set("error", decoded.error);
  redirect(`/vehicles/import?${params.toString()}`);
}

export async function createRequestAction(formData: FormData) {
  const session = await requireUser();
  const parsed = serviceRequestSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    problemText: formData.get("problemText"),
    description: formData.get("description") || undefined,
    zip: formData.get("zip"),
    preferredDate: formData.get("preferredDate") || undefined,
    preferredTimeWindow: formData.get("preferredTimeWindow") || undefined,
    budgetCents: formData.get("budgetCents") || undefined,
    mobilePreferred: formData.get("mobilePreferred") === "on",
    mechanicProfileId: formData.get("mechanicProfileId") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check your request.");
  const result = await createServiceRequest({
    customerId: session.id,
    ...parsed.data,
  });
  revalidateJobSurfaces(result.job?.id);
  if (result.job) {
    redirect(`/jobs/${result.job.id}`);
  }
  redirect(`/mechanics?request=${result.request.id}&zip=${parsed.data.zip}`);
}

export async function sendMessageAction(formData: FormData) {
  const session = await requireUser();
  const parsed = messageSchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) throw new Error("Message cannot be empty.");
  const thread = await prisma.messageThread.findUniqueOrThrow({ where: { id: parsed.data.threadId } });
  if (thread.customerId !== session.id && thread.mechanicId !== session.id && session.role !== "ADMIN") {
    throw new Error("Not authorized.");
  }
  await prisma.message.create({
    data: { threadId: thread.id, senderId: session.id, body: parsed.data.body },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date() },
  });
  revalidateJobSurfaces(thread.jobId ?? undefined);
  revalidatePath(`/messages/${thread.id}`);
  revalidatePath(`/mechanic/messages/${thread.id}`);
  revalidatePath(`/admin/messages/${thread.id}`);
}

export async function markThreadReadAction(threadId: string) {
  const session = await requireUser();
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!thread || (thread.customerId !== session.id && thread.mechanicId !== session.id)) {
    return;
  }
  await markThreadRead(threadId, session.id);
  revalidatePath("/home");
  revalidatePath("/messages");
  revalidatePath("/vehicles");
  revalidatePath("/mechanic");
  revalidatePath("/mechanic/messages");
}

export async function createShopRepairOrderAction(formData: FormData) {
  const session = await requireUser();
  if (session.role !== "MECHANIC") throw new Error("Not authorized.");
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const problemText = String(formData.get("problemText") ?? "").trim();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.archivedAt || problemText.length < 8) {
    throw new Error("Pick a customer vehicle and describe the work.");
  }
  const result = await createShopRepairOrder({
    mechanicUserId: session.id,
    customerId: vehicle.customerId,
    vehicleId: vehicle.id,
    problemText,
    description: String(formData.get("description") ?? "") || undefined,
    date: String(formData.get("date") ?? "") || undefined,
    time: String(formData.get("time") ?? "") || undefined,
  });
  revalidateJobSurfaces(result.job.id);
  redirect(`/mechanic/jobs/${result.job.id}`);
}

export async function createEstimateAction(formData: FormData) {
  const session = await requireUser();
  const rawItems = formData.getAll("itemDescription");
  const lineItems = rawItems
    .map((_, index) => ({
      category: formData.getAll("itemCategory")[index],
      description: formData.getAll("itemDescription")[index],
      quantity: formData.getAll("itemQuantity")[index],
      unitCents: Math.round(Number(formData.getAll("itemUnit")[index]) * 100),
    }))
    .filter((item) => String(item.description ?? "").trim().length > 0);
  const parsed = estimateSchema.safeParse({
    jobId: formData.get("jobId"),
    type: formData.get("type") ?? "PRIMARY",
    reason: formData.get("reason") || undefined,
    notes: formData.get("notes") || undefined,
    lineItems,
  });
  if (!parsed.success) throw new Error("Add complete line items before sending.");
  const estimate = await createEstimate({ ...parsed.data, mechanicId: session.id });
  revalidateJobSurfaces(parsed.data.jobId);
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
  revalidateJobSurfaces(estimate.jobId);
}

export async function updateJobStatusAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const status = String(formData.get("status")) as JobStatus;
  const job = await getJobForUser(jobId, session.id, session.role);
  if (!job) throw new Error("Job not found.");
  await transitionJob(jobId, status, session.id, String(formData.get("note") ?? "") || undefined);
  revalidateJobSurfaces(jobId);
}

export async function scheduleAppointmentAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const job = await getJobForUser(jobId, session.id, session.role);
  if (!job) throw new Error("Job not found.");
  await scheduleJobAppointment({
    jobId,
    actorId: session.id,
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
  });
  revalidateJobSurfaces(jobId);
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
  revalidateJobSurfaces(parsed.data.jobId);
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
  revalidateJobSurfaces(job.id);
  redirect(`/jobs/${job.id}`);
}

export async function uploadJobPhotoAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const job = await getJobForUser(jobId, session.id, session.role);
  if (!job) throw new Error("Job not found.");
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a photo to upload.");
  const kindRaw = String(formData.get("kind") ?? "OTHER");
  const kind = (["BEFORE", "AFTER", "DIAGNOSIS", "PARTS", "OTHER"].includes(kindRaw) ? kindRaw : "OTHER") as PhotoKind;
  const caption = String(formData.get("caption") ?? "").trim() || undefined;
  const url = await savePublicUpload(file, `jobs/${job.id}`);
  await prisma.jobPhoto.create({
    data: { jobId: job.id, kind, url, caption },
  });
  revalidateJobSurfaces(job.id);
}

export async function saveRepairRecordAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const job = await getJobForUser(jobId, session.id, session.role);
  if (!job || job.mechanicUserId !== session.id) throw new Error("Not authorized.");
  await prisma.repairRecord.upsert({
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
  revalidateJobSurfaces(jobId);
}

export async function startShopThreadAction(formData: FormData) {
  const mechanicProfileId = String(formData.get("mechanicProfileId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const next = `/messages/start?shop=${encodeURIComponent(mechanicProfileId)}`;
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (session.role !== "CUSTOMER") redirect(slug ? `/mechanics/${slug}` : "/mechanics");
  const result = await getOrCreateShopThread(session.id, mechanicProfileId);
  if (!result) throw new Error("Shop not found.");
  revalidatePath("/messages");
  revalidatePath("/mechanic/messages");
  revalidatePath("/notifications");
  revalidatePath(`/messages/${result.thread.id}`);
  revalidatePath(`/mechanic/messages/${result.thread.id}`);
  redirect(`/messages/${result.thread.id}`);
}

export async function toggleSavedShopAction(formData: FormData) {
  const mechanicProfileId = String(formData.get("mechanicProfileId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const returnTo = safeInternalPath(formData.get("returnTo")) ?? (slug ? `/mechanics/${slug}` : "/saved");
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(`/saved/add?shop=${encodeURIComponent(mechanicProfileId)}`)}`);
  }
  if (session.role !== "CUSTOMER") redirect(returnTo);
  const profile = await prisma.mechanicProfile.findUnique({ where: { id: mechanicProfileId } });
  if (!profile) throw new Error("Shop not found.");
  const existing = await prisma.savedMechanic.findUnique({
    where: { customerId_mechanicProfileId: { customerId: session.id, mechanicProfileId } },
  });
  if (existing) {
    await prisma.savedMechanic.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedMechanic.create({ data: { customerId: session.id, mechanicProfileId } });
  }
  revalidatePath("/saved");
  revalidatePath("/search");
  revalidatePath(`/mechanics/${profile.slug}`);
  redirect(returnTo);
}
