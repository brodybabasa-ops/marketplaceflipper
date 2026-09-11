import { SERVICE_CATEGORIES } from "@/lib/constants";
import type { ServiceCategory } from "@prisma/client";

export const LANDING_LOCATION = "Layton, UT";
export const LANDING_ZIP = "84041";

export const VEHICLE_TYPES = [
  { value: "car", label: "Car" },
  { value: "truck", label: "Truck" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "boat", label: "Boat" },
  { value: "rv", label: "RV" },
  { value: "trailer", label: "Trailer" },
  { value: "equipment", label: "Equipment" },
] as const;

export const LANDING_CATEGORIES = [
  { slug: "automotive", label: "Automotive", image: "/landing/cat-automotive.png", href: "/mechanics?zip=84041" },
  { slug: "marine", label: "Marine", image: "/landing/cat-marine.png", href: "/mechanics?zip=84041" },
  { slug: "powersports", label: "Powersports", image: "/landing/cat-powersports.png", href: "/mechanics?zip=84041" },
  { slug: "rv", label: "RV", image: "/landing/cat-rv.png", href: "/mechanics?zip=84041" },
  { slug: "snow", label: "Snow", image: "/landing/cat-snow.png", href: "/mechanics?zip=84041" },
  { slug: "trailers", label: "Trailers", image: "/landing/cat-trailers.png", href: "/mechanics?zip=84041" },
  { slug: "heavy", label: "Heavy Equipment", image: "/landing/cat-heavy.png", href: "/mechanics?zip=84041" },
  { slug: "engines", label: "Small Engines", image: "/landing/cat-engines.png", href: "/mechanics?zip=84041" },
] as const;

export const SHOP_PHOTOS = [
  "/landing/shop-1.png",
  "/landing/shop-2.png",
  "/landing/shop-3.png",
  "/landing/shop-4.png",
] as const;

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

export function specialtyLabel(category: ServiceCategory | string) {
  return SERVICE_CATEGORIES.find((item) => item.value === category)?.label ?? String(category).replaceAll("_", " ").toLowerCase();
}

export function formatClock(hhmm: string) {
  const [hourStr, minuteStr = "00"] = hhmm.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = ((hour + 11) % 12) + 1;
  return `${display}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function minutesFromClock(hhmm: string) {
  const [hourStr, minuteStr = "00"] = hhmm.split(":");
  return Number(hourStr) * 60 + Number(minuteStr);
}

export function earliestAvailabilityLabel(
  slots: { dayOfWeek: string; startTime: string; endTime: string }[],
  now = new Date(),
) {
  if (!slots.length) return "Request a time";
  const tz = "America/Denver";
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: tz }).format(now).toUpperCase();
  const clock = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: tz,
  }).format(now);
  const nowMinutes = minutesFromClock(clock.replace(" ", ""));
  const todayIdx = DAYS.indexOf(weekday as (typeof DAYS)[number]);
  const byDay = new Map(slots.map((slot) => [slot.dayOfWeek, slot]));

  for (let offset = 0; offset < 7; offset += 1) {
    const idx = todayIdx >= 0 ? (todayIdx + offset) % 7 : offset;
    const day = DAYS[idx];
    const slot = byDay.get(day);
    if (!slot) continue;
    if (offset === 0 && nowMinutes >= minutesFromClock(slot.endTime)) continue;
    const dayLabel = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : day.charAt(0) + day.slice(1).toLowerCase();
    if (offset === 0 && nowMinutes >= minutesFromClock(slot.startTime)) {
      return `${dayLabel} until ${formatClock(slot.endTime)}`;
    }
    return `${dayLabel} ${formatClock(slot.startTime)}`;
  }
  return "Request a time";
}

export function formatShortMiles(miles: number) {
  if (!Number.isFinite(miles)) return "";
  if (miles < 0.1) return "Nearby";
  return `${miles.toFixed(1)} mi`;
}

export function formatReviewer(firstName: string, lastName: string) {
  const last = lastName.trim();
  return last ? `${firstName} ${last.charAt(0)}.` : firstName;
}

export function isOpenNow(
  slots: { dayOfWeek: string; startTime: string; endTime: string }[],
  now = new Date(),
) {
  if (!slots.length) return false;
  const tz = "America/Denver";
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: tz }).format(now).toUpperCase();
  const clock = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: tz,
  }).format(now);
  const nowMinutes = minutesFromClock(clock.replace(" ", ""));
  const slot = slots.find((item) => item.dayOfWeek === weekday);
  if (!slot) return false;
  return nowMinutes >= minutesFromClock(slot.startTime) && nowMinutes < minutesFromClock(slot.endTime);
}

export function shopPhotoFor(slug: string) {
  const sum = slug.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return SHOP_PHOTOS[sum % SHOP_PHOTOS.length];
}

export function vehiclePhotoFor(make: string, model: string) {
  const hay = `${make} ${model}`.toLowerCase();
  if (
    hay.includes("f-250") ||
    hay.includes("f-150") ||
    hay.includes("f-350") ||
    hay.includes("silverado") ||
    hay.includes("ram") ||
    hay.includes("tundra") ||
    hay.includes("tacoma")
  ) {
    return "/landing/hero-truck.png";
  }
  return "/landing/cat-automotive.png";
}

export const DIRECTORY_SERVICES = [
  { value: "SUSPENSION", label: "Suspension & Steering" },
  { value: "BRAKES", label: "Brakes" },
  { value: "STEERING", label: "Alignment" },
  { value: "DIAGNOSTICS", label: "Diagnostics" },
  { value: "MAINTENANCE", label: "General Repair" },
  { value: "OTHER", label: "Custom / Performance" },
] as const;

export const DIRECTORY_MORE_SERVICES = [
  { value: "ENGINE", label: "Engine" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "TRANSMISSION", label: "Transmission" },
  { value: "AC_HEATING", label: "A/C & heating" },
] as const;
