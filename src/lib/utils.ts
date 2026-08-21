export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatPrice(value: number | null | undefined) {
  if (value == null) return "Price on request";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMiles(value: number | null | undefined) {
  if (value == null) return "Mileage n/a";
  return `${new Intl.NumberFormat("en-US").format(value)} mi`;
}

export function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  return city || state || "Location n/a";
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const units: Array<[number, string]> = [
    [60 * 60 * 24 * 365, "year"],
    [60 * 60 * 24 * 30, "month"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24, "day"],
    [60 * 60, "hour"],
    [60, "minute"],
  ];
  for (const [size, label] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${label}${value === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

export function vehicleTitle(input: {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  title?: string | null;
}) {
  const parts = [input.year, input.make, input.model, input.trim]
    .filter((part) => part != null && String(part).length > 0)
    .join(" ");
  return parts || input.title || "Vehicle listing";
}

export function isVehicleListing(input: { category?: string | null }) {
  return !input.category || input.category === "Vehicles";
}

export function listingTitle(input: {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  title?: string | null;
  category?: string | null;
}) {
  if (!isVehicleListing(input)) {
    return input.title || [input.make, input.model].filter(Boolean).join(" ") || "Marketplace listing";
  }
  return vehicleTitle(input);
}

export function listingMeta(input: {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  normalizedTrim?: string | null;
  mileage?: number | null;
  category?: string | null;
  condition?: string | null;
}) {
  const spec = input.normalizedTrim || input.trim;
  if (!isVehicleListing(input)) {
    return [input.category, input.condition, spec || input.make].filter(Boolean).join(" · ");
  }
  return [input.year, spec, input.mileage != null ? formatMiles(input.mileage) : null].filter(Boolean).join(" · ");
}

export function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    mock: "Sample inventory",
    facebook: "Facebook Marketplace",
    ksl: "KSL Classifieds",
    craigslist: "Craigslist",
    offerup: "OfferUp",
    ebay: "eBay Motors",
    dealer: "Dealer inventory",
  };
  return labels[source] ?? source;
}
