import type { ServiceMode } from "@prisma/client";

export type ShopKind = "auto" | "marine" | "powersports" | "rv" | "other";

export function shopKind(input: {
  slug?: string | null;
  businessName?: string | null;
  specialties?: string[] | null;
  tagline?: string | null;
}): ShopKind {
  const hay = `${input.slug ?? ""} ${input.businessName ?? ""} ${(input.specialties ?? []).join(" ")} ${input.tagline ?? ""}`.toLowerCase();
  if (hay.includes("marine") || hay.includes("boat") || hay.includes("outboard") || hay.includes("pwc") || hay.includes("jet ski")) {
    return "marine";
  }
  if (
    hay.includes("powersport") ||
    hay.includes("moto") ||
    hay.includes("motorcycle") ||
    hay.includes("atv") ||
    hay.includes("utv") ||
    hay.includes("dirt")
  ) {
    return "powersports";
  }
  if (hay.includes("rv") || hay.includes("motorhome") || hay.includes("camper") || hay.includes("trailer")) {
    return "rv";
  }
  if (hay.includes("overland") || hay.includes("auto") || hay.includes("diesel") || hay.includes("tire") || hay.includes("transmission")) {
    return "auto";
  }
  return "auto";
}

export function shopKindLabel(kind: ShopKind) {
  if (kind === "marine") return "Marine";
  if (kind === "powersports") return "Powersports";
  if (kind === "rv") return "RV";
  if (kind === "other") return "Other";
  return "Auto";
}

export function shopMatchesType(
  shop: {
    slug?: string | null;
    businessName?: string | null;
    specialties?: string[] | null;
    tagline?: string | null;
    serviceMode?: ServiceMode | null;
  },
  type?: string | null,
) {
  const value = (type ?? "all").toLowerCase();
  if (!value || value === "all") return true;
  if (value === "mobile") return shop.serviceMode === "MOBILE" || shop.serviceMode === "BOTH";
  if (value === "other") return shopKind(shop) === "other";
  return shopKind(shop) === value;
}

export function shopPrimaryAction(kind: ShopKind) {
  return kind === "auto" ? "Request Service" : "Get Estimate";
}

export function availableChip(availabilityLabel: string, openNow?: boolean) {
  if (openNow || availabilityLabel.toLowerCase().startsWith("today")) return "Available Today";
  if (availabilityLabel.toLowerCase().startsWith("tomorrow")) return "Available Tomorrow";
  return "Available This Week";
}
