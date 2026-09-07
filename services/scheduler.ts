import type { ScheduleBlockKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jobAssetLabel } from "@/lib/asset-display";
import { resolveOperatingModel, operatingViews } from "@/lib/operating-model";
import { audit } from "@/lib/audit";

function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 60000;
}

export async function getScheduleBoard(mechanicProfileId: string, day: Date) {
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: mechanicProfileId },
    include: {
      availability: true,
      blockedDates: true,
      technicianProfiles: { where: { active: true } },
      resources: { where: { active: true } },
      locations: true,
    },
  });
  const model = resolveOperatingModel(profile);
  const views = operatingViews(model);
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [blocks, jobs] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { mechanicProfileId, startsAt: { gte: start, lt: end } },
      include: {
        job: { include: { customer: true, asset: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true } },
        technician: true,
        resource: true,
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.job.findMany({
      where: { mechanicProfileId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: { customer: true, asset: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true, estimates: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const scheduledJobIds = new Set(blocks.map((item) => item.jobId).filter(Boolean));
  const unscheduled = jobs.filter((job) => !scheduledJobIds.has(job.id) && !job.scheduledAt);
  const onCalendar = jobs.filter((job) => job.scheduledAt && job.scheduledAt >= start && job.scheduledAt < end);

  const techs = profile.technicianProfiles.length
    ? profile.technicianProfiles
    : [{ id: "solo", displayName: profile.businessName, duty: model === "MOBILE_ONLY" ? "OFF_SITE" : model === "SHOP_ONLY" ? "SHOP" : "BOTH" }];

  return { profile, model, views, blocks, jobs, unscheduled, onCalendar, techs, resources: profile.resources, locations: profile.locations, day: start };
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
  if (conflicts.hard.length && !input.overrideReason) {
    throw new Error(conflicts.hard[0]);
  }
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
      data: { scheduledAt: input.startsAt, events: { create: { status: "SCHEDULED", note: `Work block ${input.startsAt.toLocaleString()}–${input.endsAt.toLocaleTimeString()}` } } },
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
  await audit({
    actorId: input.actorId,
    action: "SCHEDULE_BLOCK_MOVED",
    targetType: "ScheduleBlock",
    targetId: block.id,
  });
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
    if (hit) hard.push(`That resource is occupied by “${hit.title}” until ${hit.endsAt.toLocaleTimeString()}.`);
  }
  if (input.jobId) {
    const job = await prisma.job.findUnique({ where: { id: input.jobId } });
    if (job?.partsStatus === "DELAYED") warnings.push("Parts are delayed. Scheduling repair capacity may waste the slot.");
    if (job?.status === "AWAITING_APPROVAL") warnings.push("This job is still awaiting authorization. Diagnosis time is fine; full repair capacity may not be.");
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
    include: { technicianProfiles: { where: { active: true } }, availability: true },
  });
  const durationMin = 120;
  const techs = profile.technicianProfiles;
  const now = new Date();
  const candidates = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);
    day.setHours(9, 30, 0, 0);
    const end = new Date(day.getTime() + durationMin * 60000);
    const tech = techs[0];
    const conflicts = await detectConflicts({
      mechanicProfileId,
      startsAt: day,
      endsAt: end,
      technicianProfileId: tech?.id,
      jobId,
    });
    if (conflicts.hard.length) continue;
    candidates.push({
      startsAt: day,
      endsAt: end,
      technicianId: tech?.id ?? null,
      technicianName: tech?.displayName ?? profile.businessName,
      reasons: [
        tech ? `${tech.displayName} is available` : "Opening on the board",
        `${durationMin / 60} hour block`,
        job.serviceRequest.category.replaceAll("_", " ").toLowerCase(),
        jobAssetLabel(job),
      ],
      warnings: conflicts.warnings,
    });
    if (candidates.length >= 3) break;
  }
  return { job, candidates };
}

export async function fillMyDay(mechanicProfileId: string, day: Date) {
  const board = await getScheduleBoard(mechanicProfileId, day);
  const suggestions = board.unscheduled.slice(0, 5).map((job) => ({
    jobId: job.id,
    title: job.serviceRequest.problemText,
    customer: `${job.customer.firstName} ${job.customer.lastName}`,
    asset: jobAssetLabel(job),
    status: job.status,
    parts: job.partsStatus,
    href: `/mechanic/jobs/${job.id}`,
  }));
  return { suggestions, unscheduledCount: board.unscheduled.length };
}

export function blockTone(kind: ScheduleBlockKind, status: string) {
  if (status.includes("BEHIND") || status === "CONFLICT") return "danger";
  if (kind === "TRAVEL" || kind === "BUFFER" || kind === "BREAK" || kind === "PTO") return "muted";
  if (kind === "QC" || kind === "ROAD_TEST" || kind === "WATER_TEST") return "accent";
  if (status === "IN_PROGRESS") return "success";
  return "navy";
}

export { minutesBetween };
