export type ColorMode = "status" | "type";
export type Density = "compact" | "standard" | "detailed";
export type CheckInState = "NOT_ARRIVED" | "ARRIVING_SOON" | "CHECKED_IN" | "IN_SERVICE" | "READY" | "PICKED_UP";
export type VisualTone = "blue" | "purple" | "green" | "amber" | "red" | "gray" | "teal";

const BLOCKED_KINDS = new Set(["BREAK", "PTO", "UNAVAILABLE", "ADMIN", "BUFFER", "TRAVEL"]);

export function jobProgressPct(status?: string | null, kind?: string) {
  if (BLOCKED_KINDS.has(kind ?? "")) return 0;
  switch (status) {
    case "COMPLETED":
      return 100;
    case "READY":
      return 95;
    case "QUALITY_CHECK":
      return 85;
    case "IN_PROGRESS":
      return 65;
    case "AWAITING_APPROVAL":
      return 45;
    case "DIAGNOSING":
      return 32;
    case "CHECKED_IN":
    case "ARRIVED":
      return 18;
    case "EN_ROUTE":
      return 12;
    case "SCHEDULED":
      return 8;
    default:
      return 0;
  }
}

export function progressLabel(status?: string | null, kind?: string) {
  if (kind === "BREAK") return "Lunch / break";
  if (kind === "PTO" || kind === "UNAVAILABLE") return "Unavailable";
  if (kind === "TRAVEL") return "Travel";
  if (kind === "DROP_OFF") return "Drop-off";
  if (kind === "PICKUP") return "Pickup";
  switch (status) {
    case "CHECKED_IN":
      return "Checked in";
    case "DIAGNOSING":
      return "Diagnosing";
    case "AWAITING_APPROVAL":
      return "Waiting approval";
    case "IN_PROGRESS":
      return "Repairing";
    case "QUALITY_CHECK":
      return "Quality check";
    case "READY":
      return "Ready";
    case "COMPLETED":
      return "Completed";
    case "EN_ROUTE":
      return "En route";
    default:
      return "Scheduled";
  }
}

export function checkInState(input: {
  now: Date;
  startsAt: Date;
  jobStatus?: string | null;
  arrivedAt?: Date | null;
  kind?: string;
}) {
  if (input.jobStatus === "READY" || input.kind === "PICKUP") return "READY" as const;
  if (input.jobStatus === "COMPLETED") return "PICKED_UP" as const;
  if (input.jobStatus === "IN_PROGRESS" || input.jobStatus === "DIAGNOSING" || input.jobStatus === "QUALITY_CHECK") {
    return "IN_SERVICE" as const;
  }
  if (input.jobStatus === "CHECKED_IN" || input.jobStatus === "ARRIVED" || input.arrivedAt) return "CHECKED_IN" as const;
  const minutesToStart = (input.startsAt.getTime() - input.now.getTime()) / 60000;
  if (minutesToStart <= 15 && minutesToStart >= -5) return "ARRIVING_SOON" as const;
  return "NOT_ARRIVED" as const;
}

export function isBlockedKind(kind?: string | null) {
  return BLOCKED_KINDS.has(kind ?? "");
}

export function displayTitle(title?: string | null) {
  const cleaned = (title ?? "").replace(/^(Demo|Board):\s*/i, "").trim();
  return cleaned || "Untitled";
}

export function intersectsNow(startsAt: Date, endsAt: Date, now: Date) {
  return now.getTime() >= startsAt.getTime() && now.getTime() < endsAt.getTime();
}

export function moneyLabel(cents: number) {
  if (cents < 100) return "";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function visualTone(input: {
  mode: ColorMode;
  kind?: string;
  jobStatus?: string | null;
  category?: string | null;
  requestKind?: string | null;
  behind?: boolean;
  waiting?: boolean;
  partsStatus?: string | null;
  offsite?: boolean;
  urgent?: boolean;
}): { tone: VisualTone; label: string } {
  if (isBlockedKind(input.kind)) {
    return { tone: "gray", label: input.kind === "TRAVEL" ? "Travel" : "Blocked" };
  }
  if (input.behind || input.urgent) return { tone: "red", label: input.behind ? "Running late" : "Urgent" };
  if (input.mode === "type") {
    if (input.offsite) return { tone: "teal", label: "Mobile / field" };
    if (input.requestKind === "PRE_PURCHASE" || input.requestKind === "INSPECTION" || input.category === "DIAGNOSTICS") {
      return { tone: "purple", label: "Inspection / diagnostics" };
    }
    if (input.category === "MAINTENANCE") return { tone: "blue", label: "Maintenance" };
    if (input.urgent || input.requestKind === "ROADSIDE") return { tone: "red", label: "Emergency" };
    return { tone: "green", label: "Repair" };
  }
  if (input.jobStatus === "READY" || input.jobStatus === "COMPLETED") return { tone: "green", label: "Ready" };
  if (input.jobStatus === "AWAITING_APPROVAL" || input.partsStatus === "DELAYED" || input.partsStatus === "ORDERED" || input.waiting) {
    return { tone: "amber", label: input.waiting ? "Customer waiting" : "Waiting" };
  }
  if (input.jobStatus === "DIAGNOSING" || input.kind === "QC" || input.requestKind === "PRE_PURCHASE" || input.category === "DIAGNOSTICS") {
    return { tone: "purple", label: "Diagnostics" };
  }
  if (input.jobStatus === "IN_PROGRESS") return { tone: "green", label: "In progress" };
  return { tone: "blue", label: "Scheduled" };
}

export const TONE_CLASS: Record<VisualTone, string> = {
  blue: "border-[#0A84FF]/50 bg-[#0A84FF]/18 text-ink",
  purple: "border-purple/50 bg-purple/18 text-ink",
  green: "border-success/50 bg-success/16 text-ink",
  amber: "border-warning/50 bg-warning/16 text-ink",
  red: "border-danger/60 bg-danger/18 text-ink",
  gray: "border-line bg-slate/80 text-muted",
  teal: "border-teal/50 bg-teal/16 text-ink",
};

export function pxPerHour(density: Density) {
  if (density === "compact") return 48;
  if (density === "detailed") return 96;
  return 72;
}

export function minutesFromOpen(date: Date, openHour: number) {
  return date.getHours() * 60 + date.getMinutes() - openHour * 60;
}

export function slipRisk(input: {
  currentEndsAt: Date;
  nextStartsAt: Date | null;
  now: Date;
  behind: boolean;
  minutesBehind: number;
}) {
  if (!input.nextStartsAt || (!input.behind && input.now.getTime() <= input.currentEndsAt.getTime())) return null;
  const overrun = Math.max(input.minutesBehind, Math.round((input.now.getTime() - input.currentEndsAt.getTime()) / 60000));
  const gap = (input.nextStartsAt.getTime() - input.currentEndsAt.getTime()) / 60000;
  const delay = Math.max(0, Math.round(overrun - gap));
  if (delay <= 0) return null;
  return { delayMinutes: delay, message: `Likely ${delay}-minute delay on the next job. Customer has not been notified.` };
}

export function densitySlotMinutes(density: Density) {
  if (density === "compact") return 30;
  return 15;
}
