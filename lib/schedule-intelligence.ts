import type { JobStatus, PartsStatus, ScheduleBlockKind } from "@prisma/client";

export function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 60000;
}

export function recommendedScheduleMinutes(input: {
  laborMinutes: number;
  kind?: "WORK" | "DIAGNOSIS" | "QC" | "ROAD_TEST" | "WATER_TEST";
  bufferMinutes?: number;
  includeSetup?: boolean;
  includeRoadTest?: boolean;
  includeWaterTest?: boolean;
}) {
  const factors: string[] = [`${input.laborMinutes} min billed/estimated labor`];
  let scheduleMinutes = input.laborMinutes;
  if (input.kind === "DIAGNOSIS" || input.includeSetup) {
    scheduleMinutes += 30;
    factors.push("30 min setup / intake");
  }
  if (input.includeRoadTest || input.kind === "ROAD_TEST") {
    scheduleMinutes += 20;
    factors.push("20 min road test");
  }
  if (input.includeWaterTest || input.kind === "WATER_TEST") {
    scheduleMinutes += 20;
    factors.push("20 min water test");
  }
  if (input.kind === "QC") {
    scheduleMinutes += 15;
    factors.push("15 min quality control");
  }
  const buffer = input.bufferMinutes ?? 15;
  if (buffer > 0) {
    scheduleMinutes += buffer;
    factors.push(`${buffer} min provider buffer`);
  }
  return { laborMinutes: input.laborMinutes, scheduleMinutes, factors };
}

export function utilization(scheduledMinutes: number, availableMinutes: number) {
  const pct = availableMinutes <= 0 ? 0 : Math.round((scheduledMinutes / availableMinutes) * 100);
  return {
    scheduledHours: roundHours(scheduledMinutes),
    availableHours: roundHours(availableMinutes),
    openHours: roundHours(Math.max(0, availableMinutes - scheduledMinutes)),
    pct,
    overload: pct > 100,
    underused: pct > 0 && pct < 50,
  };
}

function roundHours(minutes: number) {
  return Math.round((minutes / 60) * 10) / 10;
}

export function qualificationMatch(
  tech: { displayName: string; duty: string; specialties: string[] },
  job: { category: string; offsite?: boolean },
) {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const category = job.category.toUpperCase();
  const specialtyHit = tech.specialties.some((item) => item.toUpperCase() === category || category.includes(item.toUpperCase()));
  if (specialtyHit) reasons.push(`${tech.displayName} has ${category.replaceAll("_", " ").toLowerCase()} on file`);
  else warnings.push("Calendar is open, but this technician has no matching specialty on file.");
  if (job.offsite && tech.duty === "SHOP") warnings.push("This technician is shop-only and the work is off-site.");
  if (!job.offsite && tech.duty === "OFF_SITE") warnings.push("This technician is off-site only and the work is in the shop.");
  const score = (specialtyHit ? 40 : 0) + (warnings.length ? 0 : 20) + 10;
  return { score, reasons, warnings, qualified: specialtyHit && warnings.length === 0 };
}

export function travelConflict(previousEnd: Date | null, nextStart: Date, travelMinutes: number) {
  if (!previousEnd || travelMinutes <= 0) return { ok: true as const };
  const gap = minutesBetween(previousEnd, nextStart);
  if (gap + 0.5 < travelMinutes) {
    return {
      ok: false as const,
      message: `Cannot schedule back-to-back. ${Math.round(travelMinutes)} min travel is required and only ${Math.max(0, Math.round(gap))} min is open.`,
    };
  }
  return { ok: true as const };
}

export function partsSchedulingHint(partsStatus: PartsStatus | string, kind: ScheduleBlockKind | "WORK" | "DIAGNOSIS") {
  if (kind === "DIAGNOSIS" || kind === "DROP_OFF" || kind === "TRAVEL") return null;
  if (partsStatus === "DELAYED") return { level: "warning" as const, message: "Parts are delayed. Scheduling repair capacity may waste the slot." };
  if (partsStatus === "ORDERED" || partsStatus === "ARRIVING") {
    return { level: "warning" as const, message: "Parts are not ready. Suggest scheduling the repair after expected arrival." };
  }
  if (partsStatus === "READY") return { level: "ok" as const, message: "Parts ready." };
  return null;
}

export function authorizationSchedulingHint(status: JobStatus | string, kind: ScheduleBlockKind | "WORK" | "DIAGNOSIS") {
  if (status === "AWAITING_APPROVAL" && kind === "WORK") {
    return { level: "warning" as const, message: "Estimate is awaiting authorization. Diagnosis time is fine; full repair capacity may not be." };
  }
  if (status === "DIAGNOSING" && kind === "WORK") {
    return { level: "warning" as const, message: "Still diagnosing. Keep this as a diagnosis block unless work is already authorized." };
  }
  return null;
}

const SETTLED_JOB_STATUSES = new Set(["COMPLETED", "CANCELLED", "READY", "QUALITY_CHECK"]);

export function delayRisk(input: { endsAt: Date; now: Date; jobStatus?: string; promisedReadyAt?: Date | null }) {
  const settled = SETTLED_JOB_STATUSES.has(input.jobStatus ?? "");
  const behind = !settled && input.now.getTime() > input.endsAt.getTime();
  const promiseAtRisk =
    Boolean(input.promisedReadyAt) && input.endsAt.getTime() > (input.promisedReadyAt as Date).getTime() && !settled;
  return {
    behind,
    promiseAtRisk,
    scheduleStatus: behind ? "BEHIND" : "ON_TRACK",
    minutesBehind: behind ? Math.round(minutesBetween(input.endsAt, input.now)) : 0,
  };
}

export function blockTone(kind: ScheduleBlockKind | string, flags: { behind?: boolean; conflict?: boolean; waiting?: boolean; inProgress?: boolean; blocked?: boolean }) {
  if (flags.conflict || flags.behind) return "danger" as const;
  if (flags.blocked || kind === "TRAVEL" || kind === "BUFFER" || kind === "BREAK" || kind === "PTO" || kind === "UNAVAILABLE") return "muted" as const;
  if (flags.waiting) return "warning" as const;
  if (kind === "QC" || kind === "ROAD_TEST" || kind === "WATER_TEST") return "accent" as const;
  if (flags.inProgress) return "success" as const;
  return "navy" as const;
}

export function unscheduledSource(input: { status: string; requestKind?: string; customerWaiting?: boolean; urgencyMode?: string }) {
  if (input.customerWaiting) return "CUSTOMER WAITING";
  if (input.urgencyMode === "URGENT") return "URGENT";
  if (input.requestKind === "PRE_PURCHASE") return "PPI";
  if (input.status === "REQUESTED") return "MARKETPLACE";
  if (input.status === "AWAITING_APPROVAL") return "ESTIMATE PENDING";
  if (input.status === "IN_PROGRESS") return "APPROVED / IN PROGRESS";
  return "UNSCHEDULED";
}

export function parseNaturalScheduleCommand(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/schedule\s+(.+?)\s+with\s+(.+?)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)(?:\s+(morning|afternoon|evening))?/i);
  if (!match) {
    return {
      understood: false,
      summary: "Pocket Mechanic can suggest a slot. It will never commit a schedule change without confirmation.",
    };
  }
  return {
    understood: true,
    assetHint: match[1],
    technicianHint: match[2],
    dayHint: match[3],
    windowHint: match[4] ?? "anytime",
    summary: `Suggest ${match[1]} with ${match[2]} on ${match[3]}${match[4] ? ` ${match[4]}` : ""}. Advisor confirms before anything is committed.`,
  };
}

export function scheduleMessageTemplate(kind: "BEHIND" | "PARTS" | "READY" | "EN_ROUTE" | "RESCHEDULE" | "CHECKED_IN" | "INSPECTION") {
  if (kind === "CHECKED_IN") return "Your vehicle is checked in.";
  if (kind === "BEHIND") return "We’re running approximately 20 minutes behind.";
  if (kind === "PARTS") return "A part we need is delayed. I’ll confirm the new arrival and your options before we change the appointment.";
  if (kind === "INSPECTION") return "Your inspection is complete.";
  if (kind === "READY") return "Your vehicle is ready.";
  if (kind === "EN_ROUTE") return "The technician is on the way to the service location.";
  return "We need to reschedule this appointment. I’ll send open times shortly.";
}

export function overtimeWarning(normalEnd: Date, estimatedFinish: Date) {
  const extra = minutesBetween(normalEnd, estimatedFinish);
  if (extra <= 0) return null;
  return {
    extraHours: roundHours(extra),
    message: `Estimated finish ${estimatedFinish.toLocaleTimeString()} is ${roundHours(extra)} hr past normal end ${normalEnd.toLocaleTimeString()}.`,
  };
}

export { roundHours };
