import type { ScheduleBlockKind, TechnicianDuty } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jobAssetLabel } from "@/lib/asset-display";
import { resolveOperatingModel, operatingViews } from "@/lib/operating-model";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/services/notifications";
import {
  authorizationSchedulingHint,
  delayRisk,
  minutesBetween,
  partsSchedulingHint,
  qualificationMatch,
  recommendedScheduleMinutes,
  travelConflict,
  unscheduledSource,
  utilization,
} from "@/lib/schedule-intelligence";

const SHOP_HOURS = { start: 8, end: 18 };

function dayBounds(day: Date) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function availableMinutesFor(tech: { hoursStart?: string; hoursEnd?: string }) {
  const [sh, sm] = (tech.hoursStart ?? "08:00").split(":").map(Number);
  const [eh, em] = (tech.hoursEnd ?? "18:00").split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export async function getScheduleBoard(mechanicProfileId: string, day: Date) {
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: mechanicProfileId },
    include: {
      availability: true,
      blockedDates: true,
      technicianProfiles: { where: { active: true }, include: { skills: true } },
      resources: { where: { active: true } },
      locations: true,
    },
  });
  const model = resolveOperatingModel(profile);
  const views = operatingViews(model);
  const { start, end } = dayBounds(day);
  const now = new Date();

  const [blocks, jobs, waitlist, recommended] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { mechanicProfileId, startsAt: { gte: start, lt: end } },
      include: {
        job: {
          include: {
            customer: true,
            asset: true,
            vehicle: { include: { make: true, model: true } },
            serviceRequest: true,
            estimates: { include: { repairGroups: true }, orderBy: { createdAt: "desc" }, take: 1 },
            authorizations: { orderBy: { submittedAt: "desc" }, take: 1 },
            thread: true,
          },
        },
        technician: true,
        resource: true,
        location: true,
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.job.findMany({
      where: { mechanicProfileId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: {
        customer: true,
        asset: true,
        vehicle: { include: { make: true, model: true } },
        serviceRequest: true,
        estimates: { include: { repairGroups: true }, orderBy: { createdAt: "desc" }, take: 1 },
        authorizations: { orderBy: { submittedAt: "desc" }, take: 1 },
        thread: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.waitlistEntry.findMany({ where: { mechanicProfileId }, take: 12, orderBy: { createdAt: "asc" } }),
    prisma.recommendedWork.findMany({
      where: { mechanicProfileId, status: "OPEN" },
      include: { customer: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const scheduledJobIds = new Set(blocks.map((item) => item.jobId).filter(Boolean));
  const unscheduled = jobs.filter((job) => !scheduledJobIds.has(job.id));
  const onCalendar = jobs.filter((job) => job.scheduledAt && job.scheduledAt >= start && job.scheduledAt < end);

  const techs = profile.technicianProfiles.length
    ? profile.technicianProfiles
    : [
        {
          id: "solo",
          displayName: profile.businessName,
          duty: (model === "MOBILE_ONLY" || model === "FIELD_SERVICE" ? "OFF_SITE" : model === "SHOP_ONLY" ? "SHOP" : "BOTH") as TechnicianDuty,
          specialties: [] as string[],
          hoursStart: "08:00",
          hoursEnd: "18:00",
          skills: [],
        },
      ];

  const workBlocks = blocks.filter((block) => ["WORK", "QC", "ROAD_TEST", "WATER_TEST"].includes(block.kind));
  const capacity = techs.map((tech) => {
    const mine = workBlocks.filter((block) => !block.technicianProfileId || block.technicianProfileId === tech.id || tech.id === "solo");
    const scheduled = mine.reduce((sum, block) => sum + minutesBetween(block.startsAt, block.endsAt), 0);
    return { id: tech.id, name: tech.displayName, duty: tech.duty, ...utilization(scheduled, availableMinutesFor(tech)) };
  });
  const shopCapacity = utilization(
    capacity.reduce((sum, item) => sum + item.scheduledHours * 60, 0),
    capacity.reduce((sum, item) => sum + item.availableHours * 60, 0) || 8 * 60,
  );

  const enrichedBlocks = blocks.map((block) => {
    const risk = delayRisk({
      endsAt: block.endsAt,
      now,
      jobStatus: block.job?.status,
      promisedReadyAt: block.job?.promisedReadyAt,
    });
    return {
      ...block,
      assetLabel: block.job ? jobAssetLabel(block.job) : null,
      customerName: block.job ? `${block.job.customer.firstName} ${block.job.customer.lastName}` : null,
      waiting: Boolean(block.job?.customerWaiting),
      partsStatus: block.job?.partsStatus ?? "UNKNOWN",
      authorization: block.job?.authorizations[0] ? "AUTHORIZED" : block.job?.status === "AWAITING_APPROVAL" ? "AWAITING" : "NONE",
      inProgress: block.job?.status === "IN_PROGRESS" || block.job?.status === "DIAGNOSING",
      ...risk,
      partsHint: block.job ? partsSchedulingHint(block.job.partsStatus, block.kind) : null,
      authHint: block.job ? authorizationSchedulingHint(block.job.status, block.kind) : null,
    };
  });

  const attention = [
    ...enrichedBlocks.filter((block) => block.behind).map((block) => ({
      href: block.jobId ? `/mechanic/jobs/${block.jobId}` : "/mechanic/schedule",
      label: `${block.assetLabel ?? block.title} · ${block.minutesBehind} min behind`,
      tone: "danger" as const,
    })),
    ...jobs.filter((job) => job.customerWaiting).map((job) => ({
      href: `/mechanic/jobs/${job.id}`,
      label: `${jobAssetLabel(job)} · customer waiting`,
      tone: "warning" as const,
    })),
    ...jobs.filter((job) => job.partsStatus === "DELAYED").map((job) => ({
      href: `/mechanic/jobs/${job.id}`,
      label: `${jobAssetLabel(job)} · parts delayed`,
      tone: "warning" as const,
    })),
    ...jobs.filter((job) => job.status === "AWAITING_APPROVAL").map((job) => ({
      href: `/mechanic/jobs/${job.id}`,
      label: `${jobAssetLabel(job)} · estimate awaiting approval`,
      tone: "warning" as const,
    })),
    ...enrichedBlocks.filter((block) => block.promiseAtRisk).map((block) => ({
      href: block.jobId ? `/mechanic/jobs/${block.jobId}` : "/mechanic/schedule",
      label: `${block.assetLabel ?? block.title} · promise at risk`,
      tone: "danger" as const,
    })),
  ];

  const header = {
    appointments: new Set([...onCalendar.map((job) => job.id), ...blocks.filter((block) => block.jobId).map((block) => block.jobId)]).size,
    inProgress: jobs.filter((job) => job.status === "IN_PROGRESS" || job.status === "DIAGNOSING").length,
    waitingOnParts: jobs.filter((job) => ["ORDERED", "ARRIVING", "DELAYED"].includes(job.partsStatus)).length,
    awaitingApproval: jobs.filter((job) => job.status === "AWAITING_APPROVAL").length,
    behind: enrichedBlocks.filter((block) => block.behind).length,
    ready: jobs.filter((job) => job.status === "READY").length,
    expectedCents: jobs.reduce((sum, job) => sum + (job.authorizations[0]?.authorizedCents ?? job.totalCents), 0),
    openHours: shopCapacity.openHours,
  };

  const unscheduledQueue = unscheduled.map((job) => {
    const duration = recommendedScheduleMinutes({
      laborMinutes: 120,
      kind: job.status === "AWAITING_APPROVAL" || job.status === "DIAGNOSING" ? "DIAGNOSIS" : "WORK",
      bufferMinutes: 15,
      includeSetup: job.status === "REQUESTED" || job.status === "ACCEPTED",
    });
    const techHint = techs
      .map((tech) => ({
        tech,
        match: qualificationMatch(
          { displayName: tech.displayName, duty: tech.duty, specialties: tech.specialties ?? [] },
          { category: job.serviceRequest.category, offsite: views.showRoutes },
        ),
      }))
      .sort((a, b) => b.match.score - a.match.score)[0];
    return {
      job,
      source: unscheduledSource({
        status: job.status,
        requestKind: job.serviceRequest.requestKind,
        customerWaiting: job.customerWaiting,
        urgencyMode: job.urgencyMode,
      }),
      duration,
      recommendedTech: techHint?.tech.displayName ?? profile.businessName,
      href: `/mechanic/jobs/${job.id}`,
      fitHref: `/mechanic/schedule?fit=${job.id}&date=${start.toISOString().slice(0, 10)}`,
    };
  });

  return {
    profile,
    model,
    views,
    blocks: enrichedBlocks,
    jobs,
    unscheduled,
    unscheduledQueue,
    onCalendar,
    techs,
    resources: profile.resources,
    locations: profile.locations,
    day: start,
    hours: Array.from({ length: SHOP_HOURS.end - SHOP_HOURS.start }, (_, i) => SHOP_HOURS.start + i),
    capacity,
    shopCapacity,
    attention,
    header,
    waitlist,
    recommended,
    now,
  };
}

export async function weekLoad(mechanicProfileId: string, startDay: Date) {
  const start = new Date(startDay);
  start.setHours(0, 0, 0, 0);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  const days = Array.from({ length: 5 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
  const boards: Awaited<ReturnType<typeof getScheduleBoard>>[] = [];
  for (const day of days) boards.push(await getScheduleBoard(mechanicProfileId, day));
  const techIds = boards[0]?.techs.map((tech) => ({ id: tech.id, name: tech.displayName })) ?? [];
  return {
    days: days.map((day) => day.toLocaleDateString(undefined, { weekday: "short" })),
    rows: techIds.map((tech) => ({
      ...tech,
      cells: boards.map((board) => board.capacity.find((item) => item.id === tech.id) ?? utilization(0, 8 * 60)),
    })),
  };
}

export async function createScheduleBlock(input: {
  mechanicProfileId: string;
  actorId: string;
  jobId?: string;
  technicianProfileId?: string;
  resourceId?: string;
  kind?: ScheduleBlockKind;
  title: string;
  startsAt: Date;
  endsAt: Date;
  overrideReason?: string;
}) {
  if (input.endsAt <= input.startsAt) throw new Error("End time must be after start time.");
  const conflicts = await detectConflicts(input);
  if (conflicts.hard.length && !input.overrideReason) throw new Error(conflicts.hard[0]);
  const block = await prisma.scheduleBlock.create({
    data: {
      mechanicProfileId: input.mechanicProfileId,
      jobId: input.jobId,
      technicianProfileId: input.technicianProfileId,
      resourceId: input.resourceId,
      kind: input.kind ?? "WORK",
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      overrideReason: input.overrideReason,
    },
  });
  if (input.jobId) {
    await prisma.job.update({
      where: { id: input.jobId },
      data: {
        scheduledAt: input.startsAt,
        events: { create: { status: "SCHEDULED", note: `Work block ${input.startsAt.toLocaleString()}–${input.endsAt.toLocaleTimeString()}` } },
      },
    });
  }
  await audit({
    actorId: input.actorId,
    action: "SCHEDULE_BLOCK_CREATED",
    targetType: "ScheduleBlock",
    targetId: block.id,
    metadata: { jobId: input.jobId, override: Boolean(input.overrideReason) },
  });
  return { block, warnings: conflicts.warnings };
}

export async function moveScheduleBlock(input: {
  blockId: string;
  actorId: string;
  startsAt: Date;
  endsAt: Date;
  technicianProfileId?: string | null;
  resourceId?: string | null;
  overrideReason?: string;
}) {
  const existing = await prisma.scheduleBlock.findUniqueOrThrow({ where: { id: input.blockId } });
  const conflicts = await detectConflicts({
    mechanicProfileId: existing.mechanicProfileId,
    jobId: existing.jobId ?? undefined,
    technicianProfileId: input.technicianProfileId ?? existing.technicianProfileId ?? undefined,
    resourceId: input.resourceId ?? existing.resourceId ?? undefined,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    ignoreBlockId: existing.id,
    kind: existing.kind,
  });
  if (conflicts.hard.length && !input.overrideReason) throw new Error(conflicts.hard[0]);
  const block = await prisma.scheduleBlock.update({
    where: { id: existing.id },
    data: {
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      technicianProfileId: input.technicianProfileId === undefined ? existing.technicianProfileId : input.technicianProfileId,
      resourceId: input.resourceId === undefined ? existing.resourceId : input.resourceId,
      overrideReason: input.overrideReason,
    },
  });
  if (existing.jobId) {
    await prisma.job.update({
      where: { id: existing.jobId },
      data: { scheduledAt: input.startsAt, events: { create: { status: "SCHEDULED", note: `Moved to ${input.startsAt.toLocaleString()}` } } },
    });
  }
  await audit({ actorId: input.actorId, action: "SCHEDULE_BLOCK_MOVED", targetType: "ScheduleBlock", targetId: block.id });
  return { block, warnings: conflicts.warnings };
}

export async function detectConflicts(input: {
  mechanicProfileId: string;
  startsAt: Date;
  endsAt: Date;
  technicianProfileId?: string;
  resourceId?: string;
  jobId?: string;
  ignoreBlockId?: string;
  kind?: ScheduleBlockKind;
}) {
  const overlapping = await prisma.scheduleBlock.findMany({
    where: {
      mechanicProfileId: input.mechanicProfileId,
      id: input.ignoreBlockId ? { not: input.ignoreBlockId } : undefined,
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
    include: { technician: true, resource: true },
  });
  const hard: string[] = [];
  const warnings: string[] = [];
  if (input.technicianProfileId) {
    const hit = overlapping.find((item) => item.technicianProfileId === input.technicianProfileId);
    if (hit) hard.push(`That technician already has “${hit.title}” in this window.`);
  }
  if (input.resourceId) {
    const hit = overlapping.find((item) => item.resourceId === input.resourceId);
    if (hit) hard.push(`That resource is occupied by “${hit.title}” until ${hit.endsAt.toLocaleTimeString()}. Next available after that.`);
  }
  const profile = await prisma.mechanicProfile.findUnique({
    where: { id: input.mechanicProfileId },
    include: { availability: true, blockedDates: true },
  });
  const views = profile ? operatingViews(resolveOperatingModel(profile)) : null;
  if (profile) {
    const dateKey = input.startsAt.toISOString().slice(0, 10);
    if (profile.blockedDates.some((item) => item.date.toISOString().slice(0, 10) === dateKey)) {
      hard.push("The shop is closed or blocked on that date.");
    }
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
    const window = profile.availability.find((item) => item.dayOfWeek === dayNames[input.startsAt.getDay()]);
    if (profile.availability.length && !window) hard.push("That day is outside published operating hours.");
  }
  if (input.jobId) {
    const job = await prisma.job.findUnique({ where: { id: input.jobId } });
    const parts = job ? partsSchedulingHint(job.partsStatus, input.kind ?? "WORK") : null;
    const auth = job ? authorizationSchedulingHint(job.status, input.kind ?? "WORK") : null;
    if (parts?.level === "warning") warnings.push(parts.message);
    if (auth?.level === "warning") warnings.push(auth.message);
  }
  if (views?.showTravel && input.technicianProfileId) {
    const previous = await prisma.scheduleBlock.findFirst({
      where: {
        mechanicProfileId: input.mechanicProfileId,
        technicianProfileId: input.technicianProfileId,
        id: input.ignoreBlockId ? { not: input.ignoreBlockId } : undefined,
        endsAt: { lte: input.startsAt },
      },
      orderBy: { endsAt: "desc" },
    });
    const travel = travelConflict(previous?.endsAt ?? null, input.startsAt, 20);
    if (!travel.ok) hard.push(travel.message);
  }
  if (input.endsAt.getHours() > SHOP_HOURS.end || (input.endsAt.getHours() === SHOP_HOURS.end && input.endsAt.getMinutes() > 0)) {
    warnings.push(`This block finishes after normal hours (${SHOP_HOURS.end}:00). Confirm if overtime is allowed.`);
  }
  return { hard, warnings };
}

export async function smartFit(mechanicProfileId: string, jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { serviceRequest: true, customer: true, asset: true, vehicle: { include: { make: true, model: true } } },
  });
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: mechanicProfileId },
    include: { technicianProfiles: { where: { active: true } }, availability: true, resources: { where: { active: true } } },
  });
  const views = operatingViews(resolveOperatingModel(profile));
  const duration = recommendedScheduleMinutes({
    laborMinutes: 120,
    kind: job.status === "AWAITING_APPROVAL" || job.status === "REQUESTED" ? "DIAGNOSIS" : "WORK",
    bufferMinutes: 15,
    includeSetup: true,
  });
  const techs = profile.technicianProfiles.length
    ? profile.technicianProfiles
    : [{ id: null as string | null, displayName: profile.businessName, duty: "BOTH" as TechnicianDuty, specialties: [] as string[] }];
  const now = new Date();
  const candidates = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (const hour of [8, 9, 10, 11, 13, 14, 15]) {
      for (const tech of techs) {
        const day = new Date(now);
        day.setDate(now.getDate() + dayOffset);
        day.setHours(hour, 30, 0, 0);
        if (day.getTime() < now.getTime()) continue;
        const end = new Date(day.getTime() + duration.scheduleMinutes * 60000);
        const match = qualificationMatch(
          { displayName: tech.displayName, duty: tech.duty, specialties: tech.specialties ?? [] },
          { category: job.serviceRequest.category, offsite: views.showRoutes },
        );
        const conflicts = await detectConflicts({
          mechanicProfileId,
          startsAt: day,
          endsAt: end,
          technicianProfileId: tech.id ?? undefined,
          jobId,
          kind: "WORK",
        });
        if (conflicts.hard.length) continue;
        const parts = partsSchedulingHint(job.partsStatus, "WORK");
        candidates.push({
          startsAt: day,
          endsAt: end,
          technicianId: tech.id,
          technicianName: tech.displayName,
          duration,
          score: match.score + (conflicts.warnings.length ? -10 : 10) + (match.qualified ? 20 : 0),
          reasons: [
            ...match.reasons,
            `${Math.round((duration.scheduleMinutes / 60) * 10) / 10} hour opening`,
            jobAssetLabel(job),
            ...(parts?.level === "ok" ? [parts.message] : []),
            "No technician double-booking",
          ],
          warnings: [...match.warnings, ...conflicts.warnings, ...(parts?.level === "warning" ? [parts.message] : [])],
        });
      }
    }
    if (candidates.length >= 8) break;
  }
  candidates.sort((a, b) => b.score - a.score);
  return { job, duration, candidates: candidates.slice(0, 3) };
}

export async function fillMyDay(mechanicProfileId: string, day: Date) {
  const board = await getScheduleBoard(mechanicProfileId, day);
  const suggestions = board.unscheduledQueue.slice(0, 6).map((item) => ({
    jobId: item.job.id,
    title: item.job.serviceRequest.problemText,
    customer: `${item.job.customer.firstName} ${item.job.customer.lastName}`,
    asset: jobAssetLabel(item.job),
    status: item.job.status,
    parts: item.job.partsStatus,
    source: item.source,
    hours: Math.round((item.duration.scheduleMinutes / 60) * 10) / 10,
    authorizedCents: item.job.authorizations[0]?.authorizedCents ?? item.job.totalCents,
    href: item.fitHref,
  }));
  return { suggestions, unscheduledCount: board.unscheduled.length, openHours: board.shopCapacity.openHours };
}

export async function cancellationRecovery(mechanicProfileId: string, openedMinutes: number) {
  const board = await getScheduleBoard(mechanicProfileId, new Date());
  const fits = board.unscheduledQueue.filter((item) => item.duration.scheduleMinutes <= openedMinutes + 20);
  return {
    openedHours: Math.round((openedMinutes / 60) * 10) / 10,
    fits,
    waitlist: board.waitlist,
    recommended: board.recommended.map((item) => ({
      title: item.title,
      customer: `${item.customer.firstName} ${item.customer.lastName}`,
      cents: item.estimatedCents,
      href: `/mechanic/customers/${item.customerId}`,
    })),
  };
}

export async function calloutRecovery(mechanicProfileId: string, technicianProfileId: string, day: Date) {
  const board = await getScheduleBoard(mechanicProfileId, day);
  const affected = board.blocks.filter((block) => block.technicianProfileId === technicianProfileId && block.jobId);
  const others = board.techs.filter((tech) => tech.id !== technicianProfileId);
  const plan = affected.map((block) => {
    const job = block.job;
    if (!job) return { block, suggestion: "Keep on the board", href: "/mechanic/schedule", technicianId: undefined as string | undefined };
    if (job.partsStatus === "DELAYED") {
      return { block, suggestion: "No change — waiting on parts", href: `/mechanic/jobs/${job.id}`, technicianId: undefined };
    }
    const next = others
      .map((tech) => ({
        tech,
        match: qualificationMatch(
          { displayName: tech.displayName, duty: tech.duty, specialties: tech.specialties ?? [] },
          { category: job.serviceRequest.category, offsite: board.views.showRoutes },
        ),
      }))
      .sort((a, b) => b.match.score - a.match.score)[0];
    return {
      block,
      suggestion: next
        ? `Move to ${next.tech.displayName}${next.match.warnings[0] ? ` (${next.match.warnings[0]})` : ""}`
        : "Reschedule — no other technician available",
      href: `/mechanic/jobs/${job.id}`,
      technicianId: next?.tech.id,
    };
  });
  return { affectedCount: affected.length, notifyCount: plan.filter((item) => item.block.jobId).length, plan };
}

export async function sendScheduleUpdate(input: { actorId: string; jobId: string; body: string }) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: input.jobId }, include: { thread: true } });
  if (job.mechanicUserId !== input.actorId) throw new Error("Not authorized.");
  const existing = job.thread ?? (await prisma.messageThread.findUnique({ where: { requestId: job.serviceRequestId } }));
  const threadId =
    existing?.id ??
    (
      await prisma.messageThread.create({
        data: { customerId: job.customerId, mechanicId: job.mechanicUserId, jobId: job.id, requestId: job.serviceRequestId },
      })
    ).id;
  if (existing && !existing.jobId) {
    await prisma.messageThread.update({ where: { id: existing.id }, data: { jobId: job.id } });
  }
  await prisma.message.create({ data: { threadId, senderId: input.actorId, body: input.body } });
  await prisma.messageThread.update({ where: { id: threadId }, data: { lastMessageAt: new Date() } });
  await notifyUser({ userId: job.customerId, title: "Schedule update", body: input.body.slice(0, 140), href: `/jobs/${job.id}` });
  await audit({ actorId: input.actorId, action: "schedule.customer_update", targetType: "job", targetId: job.id });
}
