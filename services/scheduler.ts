import type { JobStatus, SchedulerBlockKind, SchedulerResourceKind, ServiceCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  denverClockMinutes,
  denverDateTimeToUtc,
  formatAppointmentTime,
  formatClockRange,
  formatDenverTimeInput,
  minutesToClock,
} from "@/lib/datetime";
import { formatRelative } from "@/lib/utils";
import {
  colorForCategory,
  durationForCategory,
  inProgressStatuses,
  jobTitle,
  SCHEDULE_END_MIN,
  SCHEDULE_SNAP_MIN,
  SCHEDULE_START_MIN,
  type SchedulerHoldCard,
  type SchedulerJobCard,
  type SchedulerPartArrival,
  type SchedulerReminder,
  type SchedulerResourceCard,
} from "@/lib/scheduler";

const DEFAULT_TEAMS: Record<
  string,
  { techs: { name: string; role: string; status: string; cap: number }[]; bays: number; mobiles: number }
> = {
  "mikes-mobile-auto": {
    techs: [
      { name: "Mike", role: "Owner / Master Tech", status: "Active · On Site", cap: 5 },
      { name: "Tyler", role: "Diesel Specialist", status: "Active · On Site", cap: 5 },
      { name: "Dan", role: "General Technician", status: "Active · On Site", cap: 6 },
      { name: "Sarah", role: "Inspections / PPI", status: "Active · Mobile", cap: 4 },
      { name: "Alex", role: "Mobile Technician", status: "Active · Mobile", cap: 6 },
    ],
    bays: 2,
    mobiles: 1,
  },
  "freds-marine": {
    techs: [
      { name: "Fred", role: "Owner / Master Tech", status: "Active · On Site", cap: 5 },
      { name: "Nate", role: "Marine Technician", status: "Active · On Site", cap: 5 },
      { name: "Chris", role: "Rigging / Electrical", status: "Active · On Site", cap: 4 },
    ],
    bays: 2,
    mobiles: 1,
  },
  "precision-auto-care": {
    techs: [
      { name: "Sarah", role: "Owner / Diagnostics", status: "Active · On Site", cap: 5 },
      { name: "Luis", role: "European Specialist", status: "Active · On Site", cap: 5 },
      { name: "Maya", role: "General Technician", status: "Active · On Site", cap: 4 },
    ],
    bays: 2,
    mobiles: 0,
  },
};

export async function ensureSchedulerResources(profileId: string) {
  const existing = await prisma.schedulerResource.findMany({
    where: { mechanicProfileId: profileId },
    orderBy: { sortOrder: "asc" },
  });
  if (existing.length) return existing;

  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: profileId },
    include: { user: true },
  });
  const team = DEFAULT_TEAMS[profile.slug];
  const rows: {
    mechanicProfileId: string;
    kind: SchedulerResourceKind;
    name: string;
    role: string;
    statusLabel: string;
    capacityTotal: number;
    sortOrder: number;
  }[] = [];

  if (team) {
    team.techs.forEach((tech, index) => {
      rows.push({
        mechanicProfileId: profileId,
        kind: "TECH",
        name: tech.name,
        role: tech.role,
        statusLabel: tech.status,
        capacityTotal: tech.cap,
        sortOrder: index,
      });
    });
    for (let i = 0; i < team.bays; i += 1) {
      rows.push({
        mechanicProfileId: profileId,
        kind: "BAY",
        name: `Bay ${i + 1}`,
        role: "Shop Bay",
        statusLabel: "Open",
        capacityTotal: 1,
        sortOrder: 20 + i,
      });
    }
    for (let i = 0; i < team.mobiles; i += 1) {
      rows.push({
        mechanicProfileId: profileId,
        kind: "MOBILE",
        name: team.mobiles === 1 ? "Mobile 1" : `Mobile ${i + 1}`,
        role: "Service Truck",
        statusLabel: "Ready",
        capacityTotal: 6,
        sortOrder: 30 + i,
      });
    }
  } else {
    rows.push({
      mechanicProfileId: profileId,
      kind: "TECH",
      name: profile.user.firstName,
      role: "Owner / Master Tech",
      statusLabel: "Active · On Site",
      capacityTotal: 5,
      sortOrder: 0,
    });
    if (profile.serviceMode === "SHOP" || profile.serviceMode === "BOTH") {
      rows.push({
        mechanicProfileId: profileId,
        kind: "BAY",
        name: "Bay 1",
        role: "Shop Bay",
        statusLabel: "Open",
        capacityTotal: 1,
        sortOrder: 20,
      });
    }
    if (profile.serviceMode === "MOBILE" || profile.serviceMode === "BOTH") {
      rows.push({
        mechanicProfileId: profileId,
        kind: "MOBILE",
        name: "Mobile 1",
        role: "Service Truck",
        statusLabel: "Ready",
        capacityTotal: 6,
        sortOrder: 30,
      });
    }
  }

  await prisma.schedulerResource.createMany({ data: rows });
  const created = await prisma.schedulerResource.findMany({
    where: { mechanicProfileId: profileId },
    orderBy: { sortOrder: "asc" },
  });
  await assignMissingResources(profileId, created);
  return created;
}

async function assignMissingResources(
  profileId: string,
  resources: { id: string; kind: SchedulerResourceKind }[],
) {
  const techs = resources.filter((item) => item.kind === "TECH");
  const fallback = techs[0] ?? resources[0];
  if (!fallback) return;
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profileId, resourceId: null, status: { not: "CANCELLED" } },
    include: { serviceRequest: true },
    orderBy: { scheduledAt: "asc" },
  });
  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];
    const resource =
      (job.serviceRequest.mobilePreferred ? resources.find((item) => item.kind === "MOBILE") : undefined) ??
      techs[index % Math.max(techs.length, 1)] ??
      fallback;
    await prisma.job.update({
      where: { id: job.id },
      data: {
        resourceId: resource.id,
        durationMinutes: durationForCategory(job.serviceRequest.category),
      },
    });
  }
}

const jobCardInclude = {
  customer: true,
  vehicle: { include: { make: true, model: true } },
  serviceRequest: true,
  estimates: { include: { lineItems: true }, orderBy: { createdAt: "desc" as const } },
  thread: { select: { id: true } },
} as const;

export function toJobCard(
  job: {
    id: string;
    status: JobStatus;
    scheduledAt: Date | null;
    durationMinutes: number;
    resourceId: string | null;
    totalCents: number;
    createdAt: Date;
    customer: { firstName: string; lastName: string };
    vehicle: { year: number; make: { name: string }; model: { name: string } };
    serviceRequest: {
      problemText: string;
      category: ServiceCategory;
      mobilePreferred: boolean;
      city: string | null;
      latitude: number | null;
      longitude: number | null;
    };
    estimates: { totalCents: number; lineItems: { category: string }[] }[];
    thread: { id: string } | null;
  },
  now = new Date(),
): SchedulerJobCard {
  const estimate = job.estimates[0];
  const waitingOnParts =
    job.status === "AWAITING_APPROVAL" ||
    Boolean(
      estimate?.lineItems.some((item) => item.category === "PARTS") &&
        !["COMPLETED", "CANCELLED"].includes(job.status),
    );
  const endAt = job.scheduledAt
    ? new Date(job.scheduledAt.getTime() + job.durationMinutes * 60 * 1000)
    : null;
  const behind = Boolean(
    job.scheduledAt &&
      endAt &&
      endAt.getTime() < now.getTime() &&
      !["COMPLETED", "CANCELLED"].includes(job.status) &&
      !inProgressStatuses().includes(job.status),
  );
  return {
    id: job.id,
    href: `/mechanic/jobs/${job.id}#appointment`,
    messageHref: job.thread ? `/mechanic/messages/${job.thread.id}` : `/mechanic/jobs/${job.id}`,
    title: jobTitle(job.serviceRequest.problemText),
    customerName: job.customer.firstName,
    customerFullName: `${job.customer.firstName} ${job.customer.lastName}`,
    vehicleLabel: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`,
    status: job.status,
    category: job.serviceRequest.category,
    color: colorForCategory(job.serviceRequest.category, job.status),
    scheduledAt: job.scheduledAt?.toISOString() ?? null,
    time: job.scheduledAt ? formatDenverTimeInput(job.scheduledAt) : "09:00",
    timeLabel: job.scheduledAt ? formatAppointmentTime(job.scheduledAt) : null,
    rangeLabel: job.scheduledAt ? formatClockRange(job.scheduledAt, job.durationMinutes) : null,
    durationMinutes: job.durationMinutes || durationForCategory(job.serviceRequest.category),
    resourceId: job.resourceId,
    mobile: job.serviceRequest.mobilePreferred,
    city: job.serviceRequest.city,
    latitude: job.serviceRequest.latitude,
    longitude: job.serviceRequest.longitude,
    estimateCents: estimate?.totalCents ?? job.totalCents,
    waitingOnParts,
    behind,
    createdLabel: formatRelative(job.createdAt),
  };
}

export function toHoldCard(block: {
  id: string;
  resourceId: string;
  kind: SchedulerBlockKind;
  label: string;
  startAt: Date;
  endAt: Date;
}): SchedulerHoldCard {
  return {
    id: block.id,
    resourceId: block.resourceId,
    kind: block.kind,
    label: block.label,
    startAt: block.startAt.toISOString(),
    time: formatDenverTimeInput(block.startAt),
    durationMinutes: Math.max(15, Math.round((block.endAt.getTime() - block.startAt.getTime()) / 60000)),
  };
}

export function toResourceCard(
  resource: {
    id: string;
    kind: SchedulerResourceKind;
    name: string;
    role: string | null;
    statusLabel: string | null;
    capacityTotal: number;
    sortOrder: number;
  },
  todayJobCount: number,
  hasMobileWork: boolean,
): SchedulerResourceCard {
  const inUse = todayJobCount > 0;
  const status =
    resource.statusLabel ??
    (resource.kind === "BAY"
      ? inUse
        ? "In Use"
        : "Open"
      : resource.kind === "MOBILE"
        ? inUse
          ? "On Route"
          : "Ready"
        : hasMobileWork
          ? "Active · Mobile"
          : "Active · On Site");
  return {
    id: resource.id,
    kind: resource.kind,
    name: resource.name,
    role: resource.role ?? (resource.kind === "TECH" ? "Technician" : resource.kind === "BAY" ? "Shop Bay" : "Service Truck"),
    statusLabel: status,
    capacityUsed: todayJobCount,
    capacityTotal: resource.capacityTotal,
    sortOrder: resource.sortOrder,
  };
}

export { jobCardInclude };

export async function assertShopJob(jobId: string, actorId: string, profileId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.mechanicProfileId !== profileId) throw new Error("Job not found.");
  if (job.mechanicUserId !== actorId) {
    const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
    if (actor?.role !== "ADMIN") throw new Error("Not authorized.");
  }
  return job;
}

export async function createSchedulerHold(input: {
  profileId: string;
  actorId: string;
  resourceId: string;
  date: string;
  time: string;
  durationMinutes: number;
  kind: SchedulerBlockKind;
  label?: string;
}) {
  const resource = await prisma.schedulerResource.findFirst({
    where: { id: input.resourceId, mechanicProfileId: input.profileId },
  });
  if (!resource) throw new Error("Pick a technician, bay, or truck.");
  const duration = Math.min(8 * 60, Math.max(15, input.durationMinutes || 30));
  const startAt = denverDateTimeToUtc(input.date, input.time);
  const endAt = new Date(startAt.getTime() + duration * 60 * 1000);
  const labels: Record<SchedulerBlockKind, string> = {
    LUNCH: "Lunch",
    TRAVEL: "Travel",
    BUFFER: "Buffer",
    BREAK: "Break",
    BLOCK: "Blocked",
  };
  return prisma.schedulerBlock.create({
    data: {
      mechanicProfileId: input.profileId,
      resourceId: resource.id,
      kind: input.kind,
      label: input.label?.trim() || labels[input.kind],
      startAt,
      endAt,
    },
  });
}

export async function swapJobTimes(input: { profileId: string; actorId: string; jobA: string; jobB: string }) {
  if (input.jobA === input.jobB) throw new Error("Pick two different jobs.");
  const [a, b] = await Promise.all([
    assertShopJob(input.jobA, input.actorId, input.profileId),
    assertShopJob(input.jobB, input.actorId, input.profileId),
  ]);
  await prisma.$transaction([
    prisma.job.update({
      where: { id: a.id },
      data: { scheduledAt: b.scheduledAt, resourceId: b.resourceId },
    }),
    prisma.job.update({
      where: { id: b.id },
      data: { scheduledAt: a.scheduledAt, resourceId: a.resourceId },
    }),
  ]);
}

type Busy = { start: number; end: number };

function overlaps(a: Busy, b: Busy) {
  return a.start < b.end && a.end > b.start;
}

function nextOpenSlot(busy: Busy[], duration: number) {
  let cursor = SCHEDULE_START_MIN;
  const ordered = [...busy].sort((left, right) => left.start - right.start);
  while (cursor + duration <= SCHEDULE_END_MIN) {
    const candidate = { start: cursor, end: cursor + duration };
    const hit = ordered.find((block) => overlaps(candidate, block));
    if (!hit) return cursor;
    cursor = Math.max(cursor + SCHEDULE_SNAP_MIN, hit.end);
  }
  return null;
}

export async function optimizeShopDay(input: { profileId: string; actorId: string; date: string }) {
  const dayStart = denverDateTimeToUtc(input.date, "00:00");
  const dayEnd = denverDateTimeToUtc(input.date, "23:59");
  const [resources, jobs, blocks] = await Promise.all([
    prisma.schedulerResource.findMany({
      where: { mechanicProfileId: input.profileId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.job.findMany({
      where: {
        mechanicProfileId: input.profileId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
      include: { serviceRequest: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.schedulerBlock.findMany({
      where: { mechanicProfileId: input.profileId, startAt: { gte: dayStart, lt: dayEnd } },
    }),
  ]);
  const lanes = resources.filter((item) => item.kind === "TECH").concat(resources.filter((item) => item.kind !== "TECH"));
  const busy = new Map<string, Busy[]>();
  for (const resource of lanes) {
    busy.set(
      resource.id,
      blocks
        .filter((block) => block.resourceId === resource.id)
        .map((block) => ({ start: denverClockMinutes(block.startAt), end: denverClockMinutes(block.endAt) || denverClockMinutes(block.startAt) + 30 })),
    );
  }
  for (const job of jobs) {
    const duration = job.durationMinutes || durationForCategory(job.serviceRequest.category);
    const preferred =
      lanes.find((item) => item.id === job.resourceId) ??
      lanes.find((item) => item.kind === (job.serviceRequest.mobilePreferred ? "MOBILE" : "TECH")) ??
      lanes[0];
    if (!preferred) continue;
    const travel = preferred.kind === "MOBILE" ? 15 : 0;
    const laneBusy = busy.get(preferred.id) ?? [];
    const start = nextOpenSlot(laneBusy, duration + travel) ?? SCHEDULE_START_MIN;
    const time = minutesToClock(start);
    const when = denverDateTimeToUtc(input.date, time);
    const nextStatus =
      job.status === "REQUESTED" || job.status === "ACCEPTED" ? "SCHEDULED" : job.status;
    await prisma.job.update({
      where: { id: job.id },
      data: {
        scheduledAt: when,
        resourceId: preferred.id,
        durationMinutes: duration,
        status: nextStatus,
      },
    });
    laneBusy.push({ start, end: start + duration + travel });
    busy.set(preferred.id, laneBusy);
  }
}

export function remindersFromBoard(input: {
  awaiting: SchedulerJobCard[];
  unreadCount: number;
  behind: SchedulerJobCard[];
}): SchedulerReminder[] {
  const items: SchedulerReminder[] = [];
  for (const job of input.awaiting.slice(0, 3)) {
    items.push({
      id: `est-${job.id}`,
      title: `Estimate waiting (${job.customerName})`,
      detail: job.vehicleLabel,
      href: job.href,
      tone: "warn",
    });
  }
  for (const job of input.behind.slice(0, 2)) {
    items.push({
      id: `late-${job.id}`,
      title: `Behind schedule (${job.title})`,
      detail: job.rangeLabel ?? job.vehicleLabel,
      href: job.href,
      tone: "warn",
    });
  }
  if (input.unreadCount > 0) {
    items.push({
      id: "unread",
      title: `${input.unreadCount} unread message${input.unreadCount === 1 ? "" : "s"}`,
      detail: "Reply from the shop inbox",
      href: "/mechanic/messages",
      tone: "info",
    });
  }
  return items.slice(0, 4);
}

export function partsFromJobs(jobs: SchedulerJobCard[]): SchedulerPartArrival[] {
  return jobs
    .filter((job) => job.waitingOnParts)
    .slice(0, 4)
    .map((job) => ({
      id: job.id,
      title: job.title,
      detail: job.vehicleLabel,
      href: job.href,
      onTrack: !job.behind,
    }));
}
