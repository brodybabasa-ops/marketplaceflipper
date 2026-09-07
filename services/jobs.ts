import type { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ALLOWED_JOB_TRANSITIONS, refreshMechanicScore } from "@/services/mechanics";
import { notify } from "@/services/notifications";
import { classifyProblem } from "@/services/problem-classifier";

export async function createServiceRequest(input: {
  customerId: string;
  vehicleId: string;
  mechanicProfileId?: string;
  problemText: string;
  description?: string;
  zip: string;
  preferredDate?: string;
  preferredTimeWindow?: string;
  budgetCents?: number;
  mobilePreferred?: boolean;
}) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, customerId: input.customerId },
  });
  if (!vehicle) throw new Error("Vehicle not found.");

  const zip = await prisma.zipCode.findUnique({ where: { zip: input.zip.slice(0, 5) } });
  const category = classifyProblem(input.problemText);

  const request = await prisma.serviceRequest.create({
    data: {
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      mechanicProfileId: input.mechanicProfileId,
      problemText: input.problemText,
      description: input.description,
      category,
      zip: input.zip.slice(0, 5),
      city: zip?.city,
      state: zip?.stateCode,
      latitude: zip?.latitude,
      longitude: zip?.longitude,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
      preferredTimeWindow: input.preferredTimeWindow,
      budgetCents: input.budgetCents,
      mobilePreferred: input.mobilePreferred ?? true,
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
      vehicleId: input.vehicleId,
      status: "REQUESTED",
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

  await notify({
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
    await notify({
      userId: job.customerId,
      title: "Your mechanic accepted the request",
      body: "You can message them and track the job from here.",
      href: `/jobs/${job.id}`,
    });
  }

  if (next === "COMPLETED") {
    await prisma.mechanicProfile.update({
      where: { id: job.mechanicProfileId },
      data: { completedJobsCount: { increment: 1 } },
    });
    await refreshMechanicScore(job.mechanicProfileId);
    await notify({
      userId: job.customerId,
      title: "Repair complete",
      body: "Review the work and leave a rating when you are ready.",
      href: `/jobs/${job.id}`,
    });
  }

  if (next === "CANCELLED") {
    await notify({
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
      serviceRequest: true,
      estimates: { include: { lineItems: true, approvals: true }, orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
      photos: true,
      repairRecord: true,
      review: { include: { response: true } },
      thread: { include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } } },
      disputes: true,
    },
  });
  if (!job) return null;
  if (role === "ADMIN") return job;
  if (job.customerId !== userId && job.mechanicUserId !== userId) return null;
  return job;
}
