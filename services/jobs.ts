import type { JobStatus, Prisma } from "@prisma/client";
import { FREDS_MARINE_SLUG, PRECISION_AUTO_SLUG } from "@/lib/constants";
import { denverDateTimeToUtc, formatDenverDateInput, proposedAppointmentFromPreferred, timeWindowToClock } from "@/lib/datetime";
import { nextRepairOrderNumber } from "@/lib/document-numbers";
import { prisma } from "@/lib/db";
import { formatAppointment } from "@/lib/utils";
import { isMarineVehicle } from "@/lib/vehicles";
import { ALLOWED_JOB_TRANSITIONS, refreshMechanicScore } from "@/services/mechanics";
import { notify } from "@/services/notifications";
import { durationForCategory } from "@/lib/scheduler";
import { classifyProblem } from "@/services/problem-classifier";
import { searchMechanics } from "@/services/search";
import { issueInvoiceForJob, persistRepairHistory } from "@/services/billing";

const MATCH_LIMIT = 5;

async function resolveAssignedShop(
  mechanicProfileId: string | undefined,
  vehicle: { make: { name: string }; model: { name: string } },
) {
  if (mechanicProfileId) {
    const named = await prisma.mechanicProfile.findUnique({
      where: { id: mechanicProfileId },
      include: { user: true },
    });
    if (!named) throw new Error("That shop is not available.");
    if (!named.acceptsNewJobs) throw new Error("That shop is not taking new requests.");
    return named;
  }
  const slug = isMarineVehicle(vehicle.make.name, vehicle.model.name) ? FREDS_MARINE_SLUG : PRECISION_AUTO_SLUG;
  const preferred = await prisma.mechanicProfile.findUnique({
    where: { slug },
    include: { user: true },
  });
  if (preferred?.acceptsNewJobs) return preferred;
  const fallback = await prisma.mechanicProfile.findFirst({
    where: { acceptsNewJobs: true },
    include: { user: true },
    orderBy: { businessName: "asc" },
  });
  if (!fallback) throw new Error("No shop is available to take this request.");
  return fallback;
}

async function selectMatchedShops(input: {
  mechanicProfileId?: string;
  vehicle: { year: number; make: { name: string }; model: { name: string } };
  zip: string;
  category: ReturnType<typeof classifyProblem>;
}) {
  if (input.mechanicProfileId) {
    const named = await prisma.mechanicProfile.findUnique({
      where: { id: input.mechanicProfileId },
      include: { user: true },
    });
    if (!named) throw new Error("That shop is not available.");
    if (!named.acceptsNewJobs) throw new Error("That shop is not taking new requests.");
    return [named];
  }

  const { matches } = await searchMechanics({
    zip: input.zip,
    category: input.category,
    make: input.vehicle.make.name,
    vehicle: `${input.vehicle.year} ${input.vehicle.make.name} ${input.vehicle.model.name}`,
    distance: "50",
    sort: "recommended",
  });
  const fallback = await resolveAssignedShop(undefined, input.vehicle);
  const uniqueIds = [...new Set([...matches.map((item) => item.id), fallback.id])];
  const profiles = await prisma.mechanicProfile.findMany({
    where: { id: { in: uniqueIds }, acceptsNewJobs: true },
    include: { user: true },
  });
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  const selected = uniqueIds.map((id) => byId.get(id)).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
  if (selected.length === 0) throw new Error("No shop is available to take this request.");
  return selected.slice(0, MATCH_LIMIT);
}

export function jobSearchWhere(q?: string | null): Prisma.JobWhereInput {
  const term = q?.trim();
  if (!term) return {};
  return {
    OR: [
      { serviceRequest: { problemText: { contains: term, mode: "insensitive" } } },
      { customer: { firstName: { contains: term, mode: "insensitive" } } },
      { customer: { lastName: { contains: term, mode: "insensitive" } } },
      { customer: { email: { contains: term, mode: "insensitive" } } },
      { mechanicProfile: { businessName: { contains: term, mode: "insensitive" } } },
      { vehicle: { nickname: { contains: term, mode: "insensitive" } } },
      { vehicle: { make: { name: { contains: term, mode: "insensitive" } } } },
      { vehicle: { model: { name: { contains: term, mode: "insensitive" } } } },
      { repairOrderNumber: { contains: term, mode: "insensitive" } },
    ],
  };
}

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
  source?: "customer" | "shop";
  actorId?: string;
}) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, customerId: input.customerId, archivedAt: null },
    include: { make: true, model: true },
  });
  if (!vehicle) throw new Error("Vehicle not found.");

  const zip = await prisma.zipCode.findUnique({ where: { zip: input.zip.slice(0, 5) } });
  const category = classifyProblem(input.problemText);
  const openedByShop = input.source === "shop";
  const shops = openedByShop
    ? [await resolveAssignedShop(input.mechanicProfileId, vehicle)]
    : await selectMatchedShops({
        mechanicProfileId: input.mechanicProfileId,
        vehicle,
        zip: input.zip.slice(0, 5),
        category,
      });
  const primary = shops[0];

  const request = await prisma.serviceRequest.create({
    data: {
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      mechanicProfileId: openedByShop || shops.length === 1 ? primary.id : null,
      status: openedByShop ? "ACCEPTED" : "MATCHED",
      problemText: input.problemText,
      description: input.description,
      category,
      zip: input.zip.slice(0, 5),
      city: zip?.city,
      state: zip?.stateCode,
      latitude: zip?.latitude,
      longitude: zip?.longitude,
      preferredDate: input.preferredDate ? denverDateTimeToUtc(input.preferredDate, "12:00") : undefined,
      preferredTimeWindow: input.preferredTimeWindow,
      budgetCents: input.budgetCents,
      mobilePreferred: input.mobilePreferred ?? true,
    },
  });

  if (openedByShop) {
    const scheduledAt = proposedAppointmentFromPreferred(input.preferredDate, input.preferredTimeWindow);
    const job = await openJobFromRequest({
      requestId: request.id,
      mechanicProfileId: primary.id,
      actorId: input.actorId ?? primary.userId,
      status: scheduledAt ? "SCHEDULED" : "ACCEPTED",
      scheduledAt,
      note: "Shop opened a repair order.",
      openingMessage: `Opened a repair order: ${input.problemText}`,
    });
    await notify({
      userId: input.customerId,
      title: `${primary.businessName} opened a repair order`,
      body: input.problemText,
      href: `/jobs/${job.id}`,
    });
    return { request, job, thread: job.thread };
  }

  const now = new Date();
  await prisma.serviceRequestOffer.createMany({
    data: shops.map((shop, rank) => ({
      requestId: request.id,
      mechanicProfileId: shop.id,
      rank,
      status: "PENDING" as const,
      notifiedAt: now,
    })),
  });

  for (const shop of shops) {
    await notify({
      userId: shop.userId,
      title: "New service request",
      body: input.problemText,
      href: "/mechanic/requests",
    });
  }

  return { request, job: null, thread: null };
}

export async function openJobFromRequest(input: {
  requestId: string;
  mechanicProfileId: string;
  actorId: string;
  status: JobStatus;
  scheduledAt?: Date | null;
  note: string;
  openingMessage: string;
}) {
  const request = await prisma.serviceRequest.findUniqueOrThrow({
    where: { id: input.requestId },
    include: { jobs: true },
  });
  const existing = request.jobs.find((job) => job.mechanicProfileId === input.mechanicProfileId && job.status !== "CANCELLED");
  if (existing) return prisma.job.findUniqueOrThrow({ where: { id: existing.id }, include: { thread: true } });

  const mechanic = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: input.mechanicProfileId },
    include: { user: true },
  });
  const job = await prisma.job.create({
    data: {
      serviceRequestId: request.id,
      customerId: request.customerId,
      mechanicUserId: mechanic.userId,
      mechanicProfileId: mechanic.id,
      vehicleId: request.vehicleId,
      repairOrderNumber: await nextRepairOrderNumber(),
      status: input.status,
      scheduledAt: input.scheduledAt ?? undefined,
      durationMinutes: durationForCategory(request.category),
      events: { create: { status: input.status, note: input.note } },
    },
  });

  const thread = await prisma.messageThread.create({
    data: {
      customerId: request.customerId,
      mechanicId: mechanic.userId,
      jobId: job.id,
      requestId: request.id,
      messages: {
        create: {
          senderId: input.actorId,
          body: input.openingMessage,
          kind: "TEXT",
        },
      },
    },
  });

  await prisma.serviceRequest.update({
    where: { id: request.id },
    data: { status: "ACCEPTED", mechanicProfileId: mechanic.id },
  });

  return { ...job, thread };
}

export async function acceptServiceRequestOffer(offerId: string, mechanicUserId: string) {
  const offer = await prisma.serviceRequestOffer.findUniqueOrThrow({
    where: { id: offerId },
    include: {
      mechanic: true,
      request: { include: { customer: true, vehicle: { include: { make: true, model: true } } } },
    },
  });
  if (offer.mechanic.userId !== mechanicUserId) throw new Error("Not authorized.");
  if (offer.status !== "PENDING") throw new Error("This request is no longer available.");
  if (offer.request.status !== "MATCHED" && offer.request.status !== "OPEN") {
    throw new Error("Another shop already took this request.");
  }

  const scheduledAt = proposedAppointmentFromPreferred(
    offer.request.preferredDate ? formatDenverDateInput(offer.request.preferredDate) : undefined,
    offer.request.preferredTimeWindow ?? undefined,
  );
  const job = await openJobFromRequest({
    requestId: offer.requestId,
    mechanicProfileId: offer.mechanicProfileId,
    actorId: mechanicUserId,
    status: scheduledAt ? "SCHEDULED" : "ACCEPTED",
    scheduledAt,
    note: "Shop accepted the request.",
    openingMessage: offer.request.problemText,
  });

  await prisma.serviceRequestOffer.update({
    where: { id: offer.id },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });
  await prisma.serviceRequestOffer.updateMany({
    where: { requestId: offer.requestId, id: { not: offer.id }, status: "PENDING" },
    data: { status: "WITHDRAWN", respondedAt: new Date() },
  });

  await notify({
    userId: offer.request.customerId,
    title: `${offer.mechanic.businessName} accepted your request`,
    body: "You can message them, approve an estimate, and track the repair from here.",
    href: `/jobs/${job.id}`,
  });
  return job;
}

export async function declineServiceRequestOffer(offerId: string, mechanicUserId: string) {
  const offer = await prisma.serviceRequestOffer.findUniqueOrThrow({
    where: { id: offerId },
    include: { mechanic: true, request: true },
  });
  if (offer.mechanic.userId !== mechanicUserId) throw new Error("Not authorized.");
  if (offer.status !== "PENDING") throw new Error("This request is no longer available.");

  await prisma.serviceRequestOffer.update({
    where: { id: offer.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  const remaining = await prisma.serviceRequestOffer.count({
    where: { requestId: offer.requestId, status: "PENDING" },
  });
  if (remaining === 0) {
    await prisma.serviceRequest.update({
      where: { id: offer.requestId },
      data: { status: "EXPIRED" },
    });
    await notify({
      userId: offer.request.customerId,
      title: "No shops took this request",
      body: "Send it again or pick a shop from Find a Shop.",
      href: "/request",
    });
  }
  return offer.requestId;
}

export async function createShopRepairOrder(input: {
  mechanicUserId: string;
  customerId: string;
  vehicleId: string;
  problemText: string;
  description?: string;
  date?: string;
  time?: string;
  resourceId?: string;
  durationMinutes?: number;
}) {
  const mechanic = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: input.mechanicUserId },
  });
  const result = await createServiceRequest({
    customerId: input.customerId,
    vehicleId: input.vehicleId,
    mechanicProfileId: mechanic.id,
    problemText: input.problemText,
    description: input.description,
    zip: mechanic.shopZip ?? "84041",
    preferredDate: input.date && !input.time ? input.date : undefined,
    source: "shop",
    actorId: input.mechanicUserId,
    mobilePreferred: false,
  });
  if (!result.job) throw new Error("The repair order did not open.");
  if (input.date && input.time) {
    await scheduleJobAppointment({
      jobId: result.job.id,
      actorId: input.mechanicUserId,
      date: input.date,
      time: input.time,
      resourceId: input.resourceId,
      durationMinutes: input.durationMinutes,
    });
  } else if (input.resourceId || input.durationMinutes) {
    await prisma.job.update({
      where: { id: result.job.id },
      data: {
        ...(input.resourceId ? { resourceId: input.resourceId } : {}),
        ...(input.durationMinutes ? { durationMinutes: input.durationMinutes } : {}),
      },
    });
  }
  return { request: result.request, job: result.job, thread: result.thread };
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
  if (!job.repairOrderNumber && (next === "ACCEPTED" || next === "SCHEDULED" || next === "IN_PROGRESS" || next === "COMPLETED")) {
    data.repairOrderNumber = await nextRepairOrderNumber();
  }

  const updated = await prisma.job.update({ where: { id: jobId }, data });

  if (next === "ACCEPTED" || next === "SCHEDULED") {
    await prisma.serviceRequest.update({
      where: { id: job.serviceRequestId },
      data: { status: "ACCEPTED", mechanicProfileId: job.mechanicProfileId },
    });
  }

  if (next === "ACCEPTED") {
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
    await persistRepairHistory(job.id);
    await issueInvoiceForJob(job.id);
    await notify({
      userId: job.customerId,
      title: "Repair complete",
      body: "Pay the invoice, then leave a verified review. This repair is saved to the vehicle.",
      href: `/jobs/${job.id}#invoice`,
    });
  }

  if (next === "SCHEDULED") {
    await notify({
      userId: actorId === job.customerId ? job.mechanicUserId : job.customerId,
      title: "Appointment scheduled",
      body: updated.scheduledAt ? formatAppointment(updated.scheduledAt) : "A time is on the job record.",
      href: actorId === job.customerId ? `/mechanic/jobs/${job.id}` : `/jobs/${job.id}`,
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

const BOOKABLE_STATUSES: JobStatus[] = ["REQUESTED", "ACCEPTED"];

export async function scheduleJobAppointment(input: {
  jobId: string;
  actorId: string;
  date: string;
  time: string;
  resourceId?: string | null;
  durationMinutes?: number;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) {
    throw new Error("Pick a date and time.");
  }
  const when = denverDateTimeToUtc(input.date, input.time);
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: input.jobId },
    include: { thread: true },
  });
  if (job.customerId !== input.actorId && job.mechanicUserId !== input.actorId) {
    const actor = await prisma.user.findUnique({ where: { id: input.actorId }, select: { role: true } });
    if (actor?.role !== "ADMIN") throw new Error("Not authorized.");
  }
  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    throw new Error("This job cannot be scheduled.");
  }

  const nextStatus: JobStatus = BOOKABLE_STATUSES.includes(job.status) ? "SCHEDULED" : job.status;
  const label = formatAppointment(when);
  const wasSet = Boolean(job.scheduledAt);
  const note = wasSet ? `Appointment moved to ${label}.` : `Appointment set for ${label}.`;

  const durationMinutes =
    input.durationMinutes && input.durationMinutes >= 15 && input.durationMinutes <= 12 * 60
      ? input.durationMinutes
      : undefined;
  const resourceId = input.resourceId === "" ? null : input.resourceId;
  const updated = await prisma.job.update({
    where: { id: job.id },
    data: {
      scheduledAt: when,
      status: nextStatus,
      ...(durationMinutes ? { durationMinutes } : {}),
      ...(resourceId !== undefined ? { resourceId } : {}),
      events: { create: { status: nextStatus, note } },
    },
  });

  if (job.status === "REQUESTED") {
    await prisma.serviceRequest.update({
      where: { id: job.serviceRequestId },
      data: { status: "ACCEPTED", mechanicProfileId: job.mechanicProfileId },
    });
  }

  if (job.thread) {
    await prisma.message.create({
      data: {
        threadId: job.thread.id,
        senderId: input.actorId,
        body: note,
        kind: "TEXT",
      },
    });
    await prisma.messageThread.update({
      where: { id: job.thread.id },
      data: { lastMessageAt: new Date() },
    });
  }

  const recipients = [
    input.actorId === job.customerId ? null : { userId: job.customerId, href: `/jobs/${job.id}` },
    input.actorId === job.mechanicUserId ? null : { userId: job.mechanicUserId, href: `/mechanic/jobs/${job.id}` },
  ].filter((item): item is { userId: string; href: string } => Boolean(item));
  for (const recipient of recipients) {
    await notify({
      userId: recipient.userId,
      title: wasSet ? "Appointment updated" : "Appointment scheduled",
      body: label,
      href: recipient.href,
    });
  }

  return updated;
}

export async function ensureAppointmentAfterApproval(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { serviceRequest: true },
  });
  if (job.scheduledAt) return job;
  const preferredDate = job.serviceRequest.preferredDate
    ? formatDenverDateInput(job.serviceRequest.preferredDate)
    : undefined;
  if (!preferredDate) return job;
  const when = denverDateTimeToUtc(preferredDate, timeWindowToClock(job.serviceRequest.preferredTimeWindow));
  return prisma.job.update({
    where: { id: job.id },
    data: {
      scheduledAt: when,
      events: { create: { status: job.status, note: `Appointment set for ${formatAppointment(when)}.` } },
    },
  });
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
      photos: { orderBy: { createdAt: "desc" } },
      repairRecord: true,
      review: { include: { response: true } },
      thread: { include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } } },
      disputes: true,
      invoice: true,
    },
  });
  if (!job) return null;
  if (role === "ADMIN") return job;
  if (job.customerId !== userId && job.mechanicUserId !== userId) return null;
  return job;
}

export async function getMatchedRequestForCustomer(requestId: string, customerId: string) {
  const request = await prisma.serviceRequest.findFirst({
    where: { id: requestId, customerId },
    include: {
      vehicle: { include: { make: true, model: true } },
      jobs: { include: { mechanicProfile: true }, orderBy: { createdAt: "desc" } },
      offers: {
        include: { mechanic: true },
        orderBy: { rank: "asc" },
      },
    },
  });
  return request;
}
