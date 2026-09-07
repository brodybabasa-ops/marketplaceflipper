import type { JobStatus, RequestKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ALLOWED_JOB_TRANSITIONS, refreshMechanicScore } from "@/services/mechanics";
import { notifyUser } from "@/services/notifications";
import { classifyNeed } from "@/services/problem-classifier";
import { createAutomotiveAsset } from "@/services/assets";

export async function createServiceRequest(input: {
  customerId: string;
  vehicleId?: string;
  assetId?: string;
  mechanicProfileId?: string;
  problemText: string;
  description?: string;
  zip: string;
  preferredDate?: string;
  preferredTimeWindow?: string;
  budgetCents?: number;
  mobilePreferred?: boolean;
  whenItHappens?: string;
  noticedWhen?: string[];
  startedWhen?: string;
  warningLights?: string;
  drivability?: string;
  summary?: string;
  requestKind?: RequestKind;
  urgencyMode?: "NORMAL" | "URGENT";
}) {
  const vehicle = input.vehicleId
    ? await prisma.vehicle.findFirst({
        where: { id: input.vehicleId, customerId: input.customerId },
        include: { make: true, model: true },
      })
    : null;

  let asset = input.assetId
    ? await prisma.asset.findFirst({
        where: { id: input.assetId, ownerId: input.customerId },
        include: { industry: true },
      })
    : vehicle
      ? await prisma.asset.findUnique({ where: { vehicleId: vehicle.id }, include: { industry: true } })
      : null;

  if (!asset && vehicle) {
    const created = await createAutomotiveAsset({
      id: vehicle.id,
      customerId: vehicle.customerId,
      year: vehicle.year,
      mileage: vehicle.mileage,
      vin: vehicle.vin,
      plate: vehicle.plate,
      trim: vehicle.trim,
      nickname: vehicle.nickname,
      photoUrl: vehicle.photoUrl,
      makeName: vehicle.make.name,
      modelName: vehicle.model.name,
    });
    asset = await prisma.asset.findFirstOrThrow({
      where: { id: created.id },
      include: { industry: true },
    });
  }

  if (!asset && !vehicle) throw new Error("Choose something from your garage.");
  if (asset && asset.ownerId !== input.customerId) throw new Error("Choose something from your garage.");

  const industryKey = asset?.industry.key ?? "AUTOMOTIVE";
  const zip = await prisma.zipCode.findUnique({ where: { zip: input.zip.slice(0, 5) } });
  const classified = classifyNeed(input.problemText, industryKey);

  const request = await prisma.serviceRequest.create({
    data: {
      customerId: input.customerId,
      vehicleId: vehicle?.id ?? asset?.vehicleId,
      assetId: asset?.id,
      industryId: asset?.industryId,
      requestKind: input.requestKind ?? "REPAIR",
      taxonomyKey: classified.taxonomyKey,
      mechanicProfileId: input.mechanicProfileId,
      problemText: input.problemText,
      description: input.description,
      category: classified.category,
      zip: input.zip.slice(0, 5),
      city: zip?.city,
      state: zip?.stateCode,
      latitude: zip?.latitude,
      longitude: zip?.longitude,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
      preferredTimeWindow: input.preferredTimeWindow,
      budgetCents: input.budgetCents,
      mobilePreferred: input.mobilePreferred ?? true,
      whenItHappens: input.whenItHappens,
      noticedWhen: input.noticedWhen ?? [],
      startedWhen: input.startedWhen,
      warningLights: input.warningLights,
      drivability: input.drivability,
      summary: input.summary,
      urgencyMode: input.urgencyMode ?? "NORMAL",
    },
  });

  if (!input.mechanicProfileId) return { request, job: null, thread: null };

  const mechanic = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: input.mechanicProfileId },
    include: { user: true },
  });

  const job = await prisma.job.create({
    data: {
      serviceRequestId: request.id,
      customerId: input.customerId,
      mechanicUserId: mechanic.userId,
      mechanicProfileId: mechanic.id,
      vehicleId: vehicle?.id ?? asset?.vehicleId,
      assetId: asset?.id,
      status: "REQUESTED",
      urgencyMode: input.urgencyMode ?? "NORMAL",
      events: { create: { status: "REQUESTED", note: "Customer requested service." } },
    },
  });

  const thread = await prisma.messageThread.create({
    data: {
      customerId: input.customerId,
      mechanicId: mechanic.userId,
      jobId: job.id,
      requestId: request.id,
      messages: {
        create: {
          senderId: input.customerId,
          body: input.problemText,
          kind: "TEXT",
        },
      },
    },
  });

  await notifyUser({
    userId: mechanic.userId,
    title: "New service request",
    body: input.problemText,
    href: `/mechanic/requests`,
  });

  return { request, job, thread };
}

export async function transitionJob(jobId: string, next: JobStatus, actorId: string, note?: string) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const allowed = ALLOWED_JOB_TRANSITIONS[job.status];
  if (!allowed.includes(next)) {
    throw new Error(`Cannot move a ${job.status} job to ${next}.`);
  }

  const data: Parameters<typeof prisma.job.update>[0]["data"] = {
    status: next,
    events: { create: { status: next, note } },
  };
  if (next === "ARRIVED") data.arrivedAt = new Date();
  if (next === "COMPLETED") data.completedAt = new Date();
  if (next === "CANCELLED") {
    data.cancelledAt = new Date();
    data.cancelReason = note;
  }
  if (next === "SCHEDULED" && !job.scheduledAt) data.scheduledAt = new Date();

  const updated = await prisma.job.update({ where: { id: jobId }, data });

  if (next === "ACCEPTED") {
    await prisma.serviceRequest.update({
      where: { id: job.serviceRequestId },
      data: { status: "ACCEPTED", mechanicProfileId: job.mechanicProfileId },
    });
    await notifyUser({
      userId: job.customerId,
      title: "Your mechanic accepted the request",
      body: "You can message them, confirm a time, and track the job from here.",
      href: `/jobs/${job.id}`,
    });
  }

  if (next === "SCHEDULED") {
    await notifyUser({
      userId: job.customerId === actorId ? job.mechanicUserId : job.customerId,
      title: "Appointment scheduled",
      body: note ?? "A time is on the calendar.",
      href: `/jobs/${job.id}`,
    });
  }

  if (next === "COMPLETED") {
    await prisma.mechanicProfile.update({
      where: { id: job.mechanicProfileId },
      data: { completedJobsCount: { increment: 1 } },
    });
    await refreshMechanicScore(job.mechanicProfileId);
    await notifyUser({
      userId: job.customerId,
      title: "Repair complete",
      body: job.paymentStatus === "PAID" ? "Review the work and leave a rating when you are ready." : "Pay the approved amount, then leave a review.",
      href: job.paymentStatus === "PAID" ? `/jobs/${job.id}` : `/jobs/${job.id}/pay`,
    });
  }

  if (next === "CANCELLED") {
    await notifyUser({
      userId: actorId === job.customerId ? job.mechanicUserId : job.customerId,
      title: "Job cancelled",
      body: note ?? "This job was cancelled.",
      href: `/jobs/${job.id}`,
    });
  }

  return updated;
}

export async function getJobForUser(jobId: string, userId: string, role: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      customer: true,
      mechanicUser: true,
      mechanicProfile: { include: { user: true, specialties: true } },
      vehicle: { include: { make: true, model: true } },
      asset: { include: { industry: true, assetType: true, identifiers: true, components: true } },
      serviceRequest: { include: { industry: true } },
      estimates: { include: { lineItems: true, approvals: true, repairGroups: { include: { lineItems: true }, orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
      photos: true,
      repairRecord: { include: { warranties: true } },
      review: { include: { response: true } },
      outcome: true,
      warranties: true,
      thread: { include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } } },
      disputes: true,
      payments: { orderBy: { createdAt: "desc" } },
      repairGroups: { include: { lineItems: true }, orderBy: { sortOrder: "asc" } },
      authorizations: { include: { decisions: true }, orderBy: { submittedAt: "desc" } },
      inspections: { include: { findings: true } },
    },
  });
  if (!job) return null;
  if (role === "ADMIN") return job;
  if (job.customerId !== userId && job.mechanicUserId !== userId) return null;
  return job;
}
