const TIMEZONE = "America/Denver";

function timezoneOffsetMs(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asUtc - date.getTime();
}

export function timeWindowToClock(window?: string | null) {
  const value = (window ?? "morning").toLowerCase();
  if (value === "afternoon") return "13:00";
  if (value === "evening") return "17:00";
  if (value === "saturday") return "10:00";
  return "09:00";
}

export function denverDateTimeToUtc(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = localAsUtc;
  for (let i = 0; i < 2; i += 1) {
    const offset = timezoneOffsetMs(TIMEZONE, new Date(utc));
    utc = localAsUtc - offset;
  }
  return new Date(utc);
}

export function formatDenverDateInput(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDenverTimeInput(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "09";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function startOfDenverDay(date = new Date()) {
  return denverDateTimeToUtc(formatDenverDateInput(date), "00:00");
}

export function startOfNextDenverDay(date = new Date()) {
  const noon = denverDateTimeToUtc(formatDenverDateInput(date), "12:00");
  return denverDateTimeToUtc(formatDenverDateInput(new Date(noon.getTime() + 24 * 60 * 60 * 1000)), "00:00");
}

export function startOfDenverMonth(date = new Date()) {
  const ymd = formatDenverDateInput(date);
  return denverDateTimeToUtc(`${ymd.slice(0, 8)}01`, "00:00");
}

export function addDenverMonths(date: Date, months: number) {
  const ymd = formatDenverDateInput(date);
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const total = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;
  return denverDateTimeToUtc(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01`, "00:00");
}

export function formatDenverMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

export function denverMonthGrid(monthStart: Date) {
  const start = startOfDenverMonth(monthStart);
  const nextMonth = addDenverMonths(start, 1);
  const lastDay = addDenverDays(nextMonth, -1);
  const gridStart = startOfDenverWeek(start);
  const gridEnd = addDenverDays(startOfDenverWeek(lastDay), 7);
  const days: Date[] = [];
  for (let cursor = gridStart; cursor < gridEnd; cursor = addDenverDays(cursor, 1)) {
    days.push(cursor);
  }
  return { start, nextMonth, lastDay, gridStart, gridEnd, days };
}

export type ScheduleView = "day" | "week" | "month";

export function mechanicScheduleHref(input: {
  view?: ScheduleView;
  date: string;
  moving?: string;
  panel?: string;
  resource?: string;
  type?: string;
  status?: string;
  mode?: string;
  q?: string;
  customize?: boolean;
}) {
  const params = new URLSearchParams();
  if (input.view) params.set("view", input.view);
  params.set("date", input.date);
  if (input.moving) params.set("moving", input.moving);
  if (input.panel) params.set("panel", input.panel);
  if (input.resource) params.set("resource", input.resource);
  if (input.type) params.set("type", input.type);
  if (input.status) params.set("status", input.status);
  if (input.mode) params.set("mode", input.mode);
  if (input.q) params.set("q", input.q);
  if (input.customize) params.set("customize", "1");
  return `/mechanic/schedule?${params.toString()}`;
}

export function formatDenverMonthDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

export function formatDenverWeekdayLong(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

export function denverClockMinutes(date: Date) {
  const [hour, minute] = formatDenverTimeInput(date).split(":").map(Number);
  return hour * 60 + minute;
}

export function minutesToClock(total: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 45, total));
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatHourLabel(hour: number) {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

export function formatClockRange(start: Date, durationMinutes: number) {
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return `${formatAppointmentTime(start)} – ${formatAppointmentTime(end)}`;
}

export function proposedAppointmentFromPreferred(preferredDate?: string, preferredTimeWindow?: string) {
  if (!preferredDate) return undefined;
  return denverDateTimeToUtc(preferredDate, timeWindowToClock(preferredTimeWindow));
}

export function formatAppointmentDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

export function formatAppointmentTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
}

export function nextBookableDenver(from = new Date()) {
  const ymd = formatDenverDateInput(from);
  const [hour] = formatDenverTimeInput(from).split(":").map(Number);
  if (hour < 16) return denverDateTimeToUtc(ymd, "16:00");
  const tomorrow = formatDenverDateInput(
    new Date(denverDateTimeToUtc(ymd, "12:00").getTime() + 24 * 60 * 60 * 1000),
  );
  return denverDateTimeToUtc(tomorrow, "09:00");
}

export function denverWeekday(date: Date) {
  const [year, month, day] = formatDenverDateInput(date).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function startOfDenverWeek(date = new Date()) {
  const ymd = formatDenverDateInput(date);
  const noon = denverDateTimeToUtc(ymd, "12:00");
  const startNoon = new Date(noon.getTime() - denverWeekday(date) * 24 * 60 * 60 * 1000);
  return denverDateTimeToUtc(formatDenverDateInput(startNoon), "00:00");
}

export function addDenverDays(date: Date, days: number) {
  const noon = denverDateTimeToUtc(formatDenverDateInput(date), "12:00");
  return denverDateTimeToUtc(
    formatDenverDateInput(new Date(noon.getTime() + days * 24 * 60 * 60 * 1000)),
    "00:00",
  );
}

export function nextDenverWeekday(weekday: number, time: string, from = new Date()) {
  const ymd = formatDenverDateInput(from);
  let delta = (weekday - denverWeekday(from) + 7) % 7;
  if (delta === 0 && formatDenverTimeInput(from) >= time) delta = 7;
  const targetNoon = new Date(denverDateTimeToUtc(ymd, "12:00").getTime() + delta * 24 * 60 * 60 * 1000);
  return denverDateTimeToUtc(formatDenverDateInput(targetNoon), time);
}
