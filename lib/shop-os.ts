import type { EstimateStatus, JobStatus } from "@prisma/client";
import { jobWaitingOnParts } from "@/lib/estimates";
import { formatHourLabel, minutesToClock } from "@/lib/datetime";

export const SHOP_PAPER = "#f4f7fb";
export const SHOP_NAVY = "#071422";
export const SHOP_BLUE = "#2f7bff";

export type ShopChip = {
  label: string;
  className: string;
};

const CHIP = {
  blue: "bg-[#e8f1ff] text-[#1d5fd6]",
  orange: "bg-[#fff1e4] text-[#c05612]",
  coral: "bg-[#ffe8ea] text-[#c81e4a]",
  green: "bg-[#e7f8ee] text-[#15803d]",
  amber: "bg-[#fff6d6] text-[#b45309]",
  red: "bg-[#fde8e8] text-[#c4453c]",
  purple: "bg-[#f3e8ff] text-[#7b4fd4]",
  slate: "bg-[#eef2f6] text-[#5c6b7a]",
};

export function shopGreeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "America/Denver",
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function shopDateLabel(now = new Date()) {
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Denver",
  });
}

export function shopRoLabel(repairOrderNumber?: string | null, fallback?: string) {
  if (repairOrderNumber) return repairOrderNumber;
  if (fallback) return fallback.slice(0, 8).toUpperCase();
  return "RO";
}

export function shopEstimateLabel(id: string, index?: number) {
  if (typeof index === "number") return `EST-${1040 + index}`;
  return `EST-${id.slice(0, 4).toUpperCase()}`;
}

export function shopJobChip(
  status: JobStatus,
  options?: { waitingOnParts?: boolean; lineItems?: { category: string }[] },
): ShopChip {
  const parts = options?.waitingOnParts ?? (options?.lineItems ? jobWaitingOnParts(status, options.lineItems) : false);
  if (parts && status !== "COMPLETED" && status !== "CANCELLED") {
    return { label: "Waiting on Parts", className: CHIP.orange };
  }
  switch (status) {
    case "IN_PROGRESS":
    case "EN_ROUTE":
    case "ARRIVED":
    case "ACCEPTED":
      return { label: "In Progress", className: CHIP.blue };
    case "DIAGNOSING":
      return { label: "Diagnostics", className: CHIP.coral };
    case "AWAITING_APPROVAL":
      return { label: "Waiting on Approval", className: CHIP.amber };
    case "COMPLETED":
      return { label: "Completed", className: CHIP.green };
    case "CANCELLED":
      return { label: "Canceled", className: CHIP.slate };
    case "DISPUTED":
      return { label: "On Hold", className: CHIP.slate };
    case "SCHEDULED":
      return { label: "Scheduled", className: CHIP.purple };
    case "REQUESTED":
      return { label: "New Request", className: CHIP.amber };
    default:
      return { label: String(status).replaceAll("_", " "), className: CHIP.slate };
  }
}

export function shopEstimateChip(status: EstimateStatus, expired = false): ShopChip {
  if (expired && status === "SENT") return { label: "Expired", className: CHIP.coral };
  switch (status) {
    case "SENT":
      return { label: "Pending", className: CHIP.amber };
    case "APPROVED":
      return { label: "Approved", className: CHIP.green };
    case "DECLINED":
      return { label: "Declined", className: CHIP.red };
    case "SUPERSEDED":
      return { label: "Replaced", className: CHIP.slate };
    default:
      return { label: "Draft", className: CHIP.slate };
  }
}

export function estimateExpired(sentAt: Date | null, status: EstimateStatus, days = 7) {
  if (status !== "SENT" || !sentAt) return false;
  return Date.now() - sentAt.getTime() > days * 24 * 60 * 60 * 1000;
}

export function percentDelta(current: number, previous: number) {
  if (previous === 0) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function clockOptions(startHour = 6, endHour = 20) {
  const options: { value: string; label: string }[] = [];
  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += 15) {
    const value = minutesToClock(minutes);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = ((hour + 11) % 12) + 1;
    options.push({
      value,
      label: `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`,
    });
  }
  return options;
}

export const SHOP_CLOCK_OPTIONS = clockOptions();

export function formatClockLabel(hhmm: string) {
  const [hourStr, minuteStr = "00"] = hhmm.split(":");
  const hour = Number(hourStr);
  if (Number.isNaN(hour)) return hhmm;
  return `${formatHourLabel(hour).replace(" ", `:${minuteStr} `)}`.replace(":00 ", " ");
}

export const SHOP_NAV = [
  { href: "/mechanic", label: "Dashboard" },
  { href: "/mechanic/schedule", label: "Calendar" },
  { href: "/mechanic/jobs", label: "Jobs / Repairs" },
  { href: "/mechanic/estimates", label: "Estimates" },
  { href: "/mechanic/customers", label: "Customers" },
  { href: "/mechanic/messages", label: "Messages" },
  { href: "/mechanic/vehicles", label: "Vehicles" },
  { href: "/mechanic/inventory", label: "Inventory" },
  { href: "/mechanic/invoicing", label: "Invoicing & Payments" },
  { href: "/mechanic/reviews", label: "Reviews" },
  { href: "/mechanic/reports", label: "Reports" },
  { href: "/mechanic/earnings", label: "Earnings" },
  { href: "/mechanic/team", label: "Team" },
  { href: "/mechanic/settings", label: "Settings" },
] as const;

export function shopSearchFor(pathname: string) {
  if (pathname.startsWith("/mechanic/schedule")) {
    return { action: "/mechanic/schedule", placeholder: "Search jobs, customers, vehicles, or anything..." };
  }
  if (pathname.startsWith("/mechanic/messages")) {
    return { action: "/mechanic/messages", placeholder: "Search messages, customers, or RO #..." };
  }
  if (pathname.startsWith("/mechanic/estimates")) {
    return { action: "/mechanic/estimates", placeholder: "Search estimates, customers, vehicles, or RO #..." };
  }
  if (pathname.startsWith("/mechanic/customers")) {
    return { action: "/mechanic/customers", placeholder: "Search customers, vehicles, RO #, or anything..." };
  }
  if (pathname.startsWith("/mechanic/reviews")) {
    return { action: "/mechanic/reviews", placeholder: "Search reviews..." };
  }
  if (pathname.startsWith("/mechanic/vehicles")) {
    return { action: "/mechanic/vehicles", placeholder: "Search vehicles, customers, or VIN..." };
  }
  if (pathname.startsWith("/mechanic/invoicing")) {
    return { action: "/mechanic/invoicing", placeholder: "Search customers, jobs, invoices..." };
  }
  if (pathname.startsWith("/mechanic/settings")) {
    return { action: "/mechanic/settings", placeholder: "Search customers, jobs, vehicles, or settings..." };
  }
  return { action: "/mechanic/jobs", placeholder: "Search customers, vehicles, RO #, or anything..." };
}

export function shopPrimaryAction(pathname: string): { href: string; label: string } | null {
  if (pathname.startsWith("/mechanic/jobs/new")) return null;
  if (pathname.startsWith("/mechanic/schedule")) return { href: "/mechanic/jobs/new", label: "Add Job" };
  if (pathname.startsWith("/mechanic/estimates")) return { href: "/mechanic/jobs", label: "New Estimate" };
  if (pathname.startsWith("/mechanic/messages")) return { href: "/mechanic/customers", label: "New Message" };
  if (pathname.startsWith("/mechanic/reviews")) return { href: "/mechanic/reviews", label: "Request Review" };
  if (pathname.startsWith("/mechanic/profile")) return null;
  if (pathname.startsWith("/mechanic/settings")) return null;
  if (pathname.startsWith("/mechanic/earnings")) return null;
  return { href: "/mechanic/jobs/new", label: "New Repair" };
}

export type ShopJobTab = "all" | "progress" | "parts" | "approval" | "completed" | "hold" | "canceled";

export function shopJobTabStatuses(tab: ShopJobTab): JobStatus[] | undefined {
  switch (tab) {
    case "progress":
      return ["ACCEPTED", "SCHEDULED", "EN_ROUTE", "ARRIVED", "DIAGNOSING", "IN_PROGRESS"];
    case "approval":
      return ["AWAITING_APPROVAL"];
    case "completed":
      return ["COMPLETED"];
    case "hold":
      return ["DISPUTED"];
    case "canceled":
      return ["CANCELLED"];
    default:
      return undefined;
  }
}
