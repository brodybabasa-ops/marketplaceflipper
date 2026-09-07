import type { JobStatus, RequestKind, ServiceRequest, UrgencyMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ALLOWED_JOB_TRANSITIONS, refreshMechanicScore } from "@/services/mechanics";
import { notifyUser } from "@/services/notifications";
import { classifyNeed } from "@/services/problem-classifier";
import { createAutomotiveAsset } from "@/services/assets";

export type RequestJobSnapshot = {
  id: string;
  mechanicProfileId: string;
  status: string;
};

export function providerAssignmentPlan(input: {
  actorId: string;
  customerId: string;
  requestStatus: string;
  mechanicProfileId: string;
  jobs: RequestJobSnapshot[];
}):
  | { ok: true; action: "reuse"; jobId: string }
  | { ok: true; action: "create"; cancelJobIds: string[] }
  | { ok: false; reason: string } {
  if (input.actorId !== input.customerId) return { ok: false, reason: "Not authorized." };
  if (["ACCEPTED", "EXPIRED", "CANCELLED"].includes(input.requestStatus)) {
    return { ok: false, reason: "This request is no longer open for a new provider." };
  }
  const active = input.jobs.filter((job) => job.status !== "CANCELLED");
  const same = active.find((job) => job.mechanicProfileId === input.mechanicProfileId);
  if (same) return { ok: true, action: "reuse", jobId: same.id };
  const committed = active.filter((job) => job.status !== "REQUESTED");
  if (committed.length) {
    return { ok: false, reason: "A provider is already working this request." };
  }
  return { ok: true, action: "create", cancelJobIds: active.map((job) => job.id) };
}

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

  await audit({
    actorId: input.customerId,
    action: "request.created",
    targetType: "serviceRequest",
    targetId: request.id,
    metadata: { requestKind: request.requestKind, mechanicProfileId: input.mechanicProfileId ?? null },
  });

  if (!input.mechanicProfileId) return { request, job: null, thread: null };

  const opened = await openJobForRequest({
    request,
    mechanicProfileId: input.mechanicProfileId,
    problemText: input.problemText,
    urgencyMode: input.urgencyMode ?? "NORMAL",
  });
  return { request, job: opened.job, thread: opened.thread };
}

async function openJobForRequest(input: {
  request: Pick<ServiceRequest, "id" | "customerId" | "vehicleId" | "assetId" | "problemText" | "urgencyMode">;
  mechanicProfileId: string;
  problemText: string;
  urgencyMode: UrgencyMode | "NORMAL" | "URGENT";
}) {
  const mechanic = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: input.mechanicProfileId },
    include: { user: true },
  });

  const job = await prisma.job.create({
    data: {
      serviceRequestId: input.request.id,
      customerId: input.request.customerId,
      mechanicUserId: mechanic.userId,
      mechanicProfileId: mechanic.id,
      vehicleId: input.request.vehicleId,
      assetId: input.request.assetId,
      status: "REQUESTED",
      urgencyMode: input.urgencyMode ?? input.request.urgencyMode ?? "NORMAL",
      events: { create: { status: "REQUESTED", note: "Customer requested this provider." } },
    },
  });

  const existingThread = await prisma.messageThread.findUnique({ where: { requestId: input.request.id } });
  const thread = existingThread
    ? await prisma.messageThread.update({
        where: { id: existingThread.id },
        data: {
          mechanicId: mechanic.userId,
          jobId: job.id,
          lastMessageAt: new Date(),
          messages: {
            create: {
              senderId: input.request.customerId,
              body: input.problemText,
              kind: "TEXT",
            },
          },
        },
      })
    : await prisma.messageThread.create({
        data: {
          customerId: input.request.customerId,
          mechanicId: mechanic.userId,
          jobId: job.id,
          requestId: input.request.id,
          messages: {
            create: {
              senderId: input.request.customerId,
              body: input.problemText,
              kind: "TEXT",
            },
          },
        },
      });

  await prisma.serviceRequest.update({
    where: { id: input.request.id },
    data: { status: "MATCHED", mechanicProfileId: mechanic.id },
  });

  await notifyUser({
    userId: mechanic.userId,
    title: "New service request",
    body: input.problemText,
    href: "/mechanic/requests",
  });

  await audit({
    actorId: input.request.customerId,
    action: "request.provider_assigned",
    targetType: "job",
    targetId: job.id,
    metadata: { requestId: input.request.id, mechanicProfileId: mechanic.id },
  });

  return { job, thread, mechanic };
}

export async function assignMechanicToRequest(input: {
  requestId: string;
  mechanicProfileId: string;
  customerId: string;
}) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: input.requestId },
    include: { jobs: true },
  });
  if (!request) throw new Error("Service request not found.");

  const plan = providerAssignmentPlan({
    actorId: input.customerId,
    customerId: request.customerId,
    requestStatus: request.status,
    mechanicProfileId: input.mechanicProfileId,
    jobs: request.jobs,
  });
  if (!plan.ok) throw new Error(plan.reason);
  if (plan.action === "reuse") {
    const job = await prisma.job.findUniqueOrThrow({ where: { id: plan.jobId } });
    return { request, job, thread: null };
  }

  for (const jobId of plan.cancelJobIds) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: "Customer requested a different provider.",
        events: { create: { status: "CANCELLED", note: "Customer requested a different provider." } },
      },
    });
  }

  const opened = await openJobForRequest({
    request,
    mechanicProfileId: input.mechanicProfileId,
    problemText: request.problemText,
    urgencyMode: request.urgencyMode,
  });
  return { request, job: opened.job, thread: opened.thread };
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

  await audit({
    actorId,
    action: `job.${next.toLowerCase()}`,
    targetType: "job",
    targetId: jobId,
    reason: note,
  });

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
