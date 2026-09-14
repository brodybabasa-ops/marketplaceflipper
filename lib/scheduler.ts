import type { JobStatus, SchedulerBlockKind, SchedulerResourceKind, ServiceCategory } from "@prisma/client";
import { denverClockMinutes, formatDenverTimeInput, formatHourLabel, minutesToClock } from "@/lib/datetime";

export const SCHEDULE_START_HOUR = 7;
export const SCHEDULE_END_HOUR = 18;
export const SCHEDULE_START_MIN = SCHEDULE_START_HOUR * 60;
export const SCHEDULE_END_MIN = SCHEDULE_END_HOUR * 60;
export const SCHEDULE_SPAN_MIN = SCHEDULE_END_MIN - SCHEDULE_START_MIN;
export const SCHEDULE_SNAP_MIN = 15;
export const SCHEDULE_HOURS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 },
  (_, index) => SCHEDULE_START_HOUR + index,
);

export type ScheduleView = "day" | "week" | "month";

export type SchedulerJobCard = {
  id: string;
  href: string;
  messageHref: string | null;
  title: string;
  customerName: string;
  customerFullName: string;
  vehicleLabel: string;
  status: JobStatus;
  category: ServiceCategory;
  color: string;
  scheduledAt: string | null;
  time: string;
  timeLabel: string | null;
  rangeLabel: string | null;
  durationMinutes: number;
  resourceId: string | null;
  mobile: boolean;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  estimateCents: number;
  waitingOnParts: boolean;
  behind: boolean;
  createdLabel: string;
};

export type SchedulerResourceCard = {
  id: string;
  kind: SchedulerResourceKind;
  name: string;
  role: string;
  statusLabel: string;
  capacityUsed: number;
  capacityTotal: number;
  sortOrder: number;
};

export type SchedulerHoldCard = {
  id: string;
  resourceId: string;
  kind: SchedulerBlockKind;
  label: string;
  startAt: string;
  time: string;
  durationMinutes: number;
};

export type SchedulerReminder = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "warn" | "info" | "ok";
};

export type SchedulerPartArrival = {
  id: string;
  title: string;
  detail: string;
  href: string;
  onTrack: boolean;
};

export function durationForCategory(category: ServiceCategory) {
  switch (category) {
    case "DIAGNOSTICS":
      return 60;
    case "MAINTENANCE":
      return 60;
    case "TIRES":
      return 60;
    case "BRAKES":
      return 90;
    case "SUSPENSION":
      return 90;
    case "STEERING":
      return 90;
    case "ELECTRICAL":
      return 90;
    case "COOLING":
      return 90;
    case "CHARGING":
      return 90;
    case "STARTING":
      return 90;
    case "AC_HEATING":
      return 90;
    case "ENGINE":
      return 120;
    case "TRANSMISSION":
      return 150;
    default:
      return 90;
  }
}

export function colorForCategory(category: ServiceCategory, status?: JobStatus) {
  if (status === "EN_ROUTE") return "#3b6ea8";
  if (status === "AWAITING_APPROVAL") return "#7b4fd4";
  switch (category) {
    case "MAINTENANCE":
      return "#2f7bff";
    case "DIAGNOSTICS":
      return "#1f9a5c";
    case "ENGINE":
      return "#1a8f62";
    case "TRANSMISSION":
      return "#0f766e";
    case "BRAKES":
      return "#d97706";
    case "SUSPENSION":
      return "#ca8a04";
    case "STEERING":
      return "#b45309";
    case "ELECTRICAL":
      return "#dc3d3d";
    case "TIRES":
      return "#2563eb";
    case "AC_HEATING":
      return "#0891b2";
    case "COOLING":
      return "#0e7490";
    case "STARTING":
      return "#4f46e5";
    case "CHARGING":
      return "#7c3aed";
    default:
      return "#3b82f6";
  }
}

export function colorForBlock(kind: SchedulerBlockKind) {
  switch (kind) {
    case "LUNCH":
      return "#334155";
    case "TRAVEL":
      return "#1e3a5f";
    case "BUFFER":
      return "#263548";
    case "BREAK":
      return "#3f4c5c";
    default:
      return "#2a3544";
  }
}

export function statusChip(status: JobStatus, waitingOnParts: boolean) {
  if (status === "AWAITING_APPROVAL") return { label: "Waiting on customer", tone: "violet" as const };
  if (waitingOnParts) return { label: "Waiting on Parts", tone: "amber" as const };
  switch (status) {
    case "IN_PROGRESS":
    case "DIAGNOSING":
    case "ARRIVED":
      return { label: "In Progress", tone: "green" as const };
    case "EN_ROUTE":
      return { label: "En Route", tone: "blue" as const };
    case "REQUESTED":
      return { label: "High Priority", tone: "red" as const };
    case "COMPLETED":
      return { label: "Done", tone: "green" as const };
    default:
      return { label: "Upcoming", tone: "blue" as const };
  }
}

export function unscheduledPriority(status: JobStatus) {
  if (status === "REQUESTED") return { label: "High Priority", tone: "red" as const };
  if (status === "AWAITING_APPROVAL") return { label: "Waiting on customer", tone: "violet" as const };
  return { label: "Standard", tone: "blue" as const };
}

export function jobTitle(problem: string) {
  const trimmed = problem.replace(/\.$/, "").trim();
  if (trimmed.length <= 28) return trimmed;
  return `${trimmed.slice(0, 26).trim()}…`;
}

export function snapMinutes(total: number) {
  const snapped = Math.round(total / SCHEDULE_SNAP_MIN) * SCHEDULE_SNAP_MIN;
  return Math.min(SCHEDULE_END_MIN - SCHEDULE_SNAP_MIN, Math.max(SCHEDULE_START_MIN, snapped));
}

export function minutesFromRatio(ratio: number) {
  return snapMinutes(SCHEDULE_START_MIN + ratio * SCHEDULE_SPAN_MIN);
}

export function blockOffset(start: Date, durationMinutes: number) {
  const startMin = denverClockMinutes(start);
  const left = ((startMin - SCHEDULE_START_MIN) / SCHEDULE_SPAN_MIN) * 100;
  const width = (durationMinutes / SCHEDULE_SPAN_MIN) * 100;
  return {
    left: `${Math.max(-2, left)}%`,
    width: `${Math.max(4.2, width)}%`,
  };
}

export function clockFromEvent(clientX: number, target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const ratio = rect.width <= 0 ? 0 : (clientX - rect.left) / rect.width;
  return minutesToClock(minutesFromRatio(ratio));
}

export function hourLabels() {
  return SCHEDULE_HOURS.map((hour) => formatHourLabel(hour));
}

export function inProgressStatuses(): JobStatus[] {
  return ["EN_ROUTE", "ARRIVED", "DIAGNOSING", "IN_PROGRESS"];
}

export function openBookStatuses(): JobStatus[] {
  return [
    "REQUESTED",
    "ACCEPTED",
    "SCHEDULED",
    "EN_ROUTE",
    "ARRIVED",
    "DIAGNOSING",
    "AWAITING_APPROVAL",
    "IN_PROGRESS",
  ];
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function mapsRouteUrl(
  origin: { latitude: number; longitude: number },
  stops: { latitude: number; longitude: number }[],
) {
  if (!stops.length) {
    return `https://www.google.com/maps/search/?api=1&query=${origin.latitude},${origin.longitude}`;
  }
  const destination = stops[stops.length - 1];
  const waypoints = stops
    .slice(0, -1)
    .map((stop) => `${stop.latitude},${stop.longitude}`)
    .join("|");
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function timeInputOrDefault(value: string | null | undefined, fallback = "09:00") {
  return value && /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

export function currentDenverClock() {
  const now = new Date();
  return {
    ymd: new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Denver",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now),
    time: formatDenverTimeInput(now),
    minutes: denverClockMinutes(now),
  };
}
