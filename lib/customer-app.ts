const TZ = "America/Denver";

export function denverDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function notificationGroup(date: Date, now = new Date()) {
  const today = denverDayKey(now);
  const key = denverDayKey(date);
  if (key === today) return "Today";
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (key === denverDayKey(yesterday)) return "Yesterday";
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (date.getTime() >= weekAgo.getTime()) return "This Week";
  return "Earlier";
}

export function formatThreadTime(date: Date, now = new Date()) {
  const today = denverDayKey(now);
  const key = denverDayKey(date);
  if (key === today) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    }).format(date);
  }
  if (key === denverDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: TZ,
  }).format(date);
}

export function formatNoticeTime(date: Date, now = new Date()) {
  const diff = now.getTime() - date.getTime();
  const hours = Math.round(diff / (60 * 60 * 1000));
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(diff / 60000));
    return `${minutes}m ago`;
  }
  if (denverDayKey(date) === denverDayKey(now) && hours < 24) return `${hours}h ago`;
  if (denverDayKey(date) === denverDayKey(new Date(now.getTime() - 86400000))) return "1d ago";
  const days = Math.max(1, Math.round(diff / 86400000));
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: TZ }).format(date);
}

export type NoticeKind = "repair" | "appointment" | "message" | "system";

export function noticeKind(title: string, body: string, href?: string | null): NoticeKind {
  const hay = `${title} ${body} ${href ?? ""}`.toLowerCase();
  if (hay.includes("/messages") || hay.includes("message")) return "message";
  if (hay.includes("appointment") || hay.includes("scheduled") || hay.includes("booked")) return "appointment";
  if (
    hay.includes("/jobs") ||
    hay.includes("/requests") ||
    hay.includes("repair") ||
    hay.includes("estimate") ||
    hay.includes("diagnos") ||
    hay.includes("parts") ||
    hay.includes("invoice")
  ) {
    return "repair";
  }
  return "system";
}

export function historyMonthKey(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(date);
}

export const NEARBY_LOCATIONS = [
  { label: "Layton, UT", zip: "84041" },
  { label: "Kaysville, UT", zip: "84037" },
  { label: "Syracuse, UT", zip: "84075" },
  { label: "Clearfield, UT", zip: "84015" },
  { label: "Farmington, UT", zip: "84025" },
  { label: "Ogden, UT", zip: "84401" },
] as const;
