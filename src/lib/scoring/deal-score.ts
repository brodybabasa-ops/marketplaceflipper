import type { Listing } from "@prisma/client";
import type { DealScoreBreakdown, MarketEstimate } from "@/types/listing";
import { isVehicleCategory } from "@/lib/categories";

type Scoreable = Pick<
  Listing,
  | "price"
  | "mileage"
  | "year"
  | "trim"
  | "normalizedMake"
  | "normalizedModel"
  | "normalizedTrim"
  | "imageUrls"
  | "city"
  | "description"
  | "firstSeenAt"
  | "condition"
  | "drivetrain"
  | "engine"
  | "category"
  | "title"
>;

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  }
  return sorted[mid]!;
}

function isVehicle(listing: Scoreable) {
  return isVehicleCategory(listing.category);
}

export function estimateMarketPrice(
  listing: Scoreable,
  comparables: Scoreable[],
): MarketEstimate {
  const prices = comparables
    .map((item) => item.price)
    .filter((price): price is number => price != null && price > 0);

  if (prices.length < 3) {
    return {
      marketPrice: null,
      delta: null,
      sampleSize: prices.length,
      label: "Insufficient market data",
    };
  }

  const marketPrice = median(prices);
  if (marketPrice == null || listing.price == null) {
    return {
      marketPrice,
      delta: null,
      sampleSize: prices.length,
      label: "Insufficient market data",
    };
  }

  const delta = listing.price - marketPrice;
  const label =
    delta < 0
      ? `${formatUsd(Math.abs(delta))} below estimated market`
      : delta > 0
        ? `${formatUsd(delta)} above estimated market`
        : "At estimated market";

  return { marketPrice, delta, sampleSize: prices.length, label };
}

export function isComparable(listing: Scoreable, candidate: Scoreable) {
  if (listing.category && candidate.category && listing.category !== candidate.category) {
    return false;
  }
  if (!listing.normalizedMake || !listing.normalizedModel) return false;
  if (candidate.normalizedMake !== listing.normalizedMake) return false;
  if (candidate.normalizedModel !== listing.normalizedModel) return false;

  if (isVehicle(listing)) {
    if (listing.year && candidate.year && Math.abs(candidate.year - listing.year) > 2) {
      return false;
    }
    if (listing.mileage && candidate.mileage) {
      const spread = Math.max(15000, listing.mileage * 0.3);
      if (Math.abs(candidate.mileage - listing.mileage) > spread) return false;
    }
  }
  return true;
}

export function scoreDeal(
  listing: Scoreable,
  comparables: Scoreable[],
  now = new Date(),
): DealScoreBreakdown {
  const market = estimateMarketPrice(listing, comparables);
  const reasons: string[] = [];
  const vehicle = isVehicle(listing);

  let priceScore = 20;
  if (market.hasOwnProperty("marketPrice") && market.marketPrice && listing.price) {
    const ratio = listing.price / market.marketPrice;
    if (ratio <= 0.8) priceScore = 50;
    else if (ratio >= 1.2) priceScore = 0;
    else priceScore = Math.round(50 - ((ratio - 0.8) / 0.4) * 50);

    if (ratio <= 0.9) reasons.push("Priced below comparable listings");
    else if (ratio >= 1.1) reasons.push("Priced above comparable listings");
  } else {
    priceScore = 18;
    reasons.push("Not enough comparable listings for a market price");
  }

  const mileageMedian = median(
    comparables.map((item) => item.mileage).filter((value): value is number => value != null),
  );
  let mileageScore = vehicle ? 8 : 10;
  if (vehicle && listing.mileage != null && mileageMedian) {
    const ratio = listing.mileage / mileageMedian;
    if (ratio <= 0.7) mileageScore = 15;
    else if (ratio >= 1.3) mileageScore = 2;
    else mileageScore = Math.round(15 - ((ratio - 0.7) / 0.6) * 13);
    if (ratio < 0.9) reasons.push("Lower mileage than similar vehicles");
  }

  let yearScore = vehicle ? 5 : 8;
  const yearMedian = median(
    comparables.map((item) => item.year).filter((value): value is number => value != null),
  );
  if (vehicle && listing.year && yearMedian) {
    const delta = listing.year - yearMedian;
    yearScore = Math.max(0, Math.min(10, 5 + delta * 2));
  }

  const ageHours = (now.getTime() - new Date(listing.firstSeenAt).getTime()) / 36e5;
  let freshness = 2;
  if (ageHours < 24) freshness = 10;
  else if (ageHours < 24 * 7) freshness = 7;
  else if (ageHours < 24 * 30) freshness = 4;

  const completenessFields = vehicle
    ? [
        listing.year,
        listing.normalizedMake,
        listing.normalizedModel,
        listing.price,
        listing.mileage,
        listing.city,
        listing.imageUrls.length > 0,
        listing.description,
        listing.drivetrain,
        listing.engine,
      ]
    : [
        listing.normalizedMake,
        listing.normalizedModel,
        listing.price,
        listing.condition,
        listing.city,
        listing.imageUrls.length > 0,
        listing.description,
        listing.category,
      ];
  const completeness = Math.round(
    (completenessFields.filter(Boolean).length / completenessFields.length) * 10,
  );

  let condition = 3;
  const blob = `${listing.condition ?? ""} ${listing.description ?? ""}`.toLowerCase();
  if (/\b(salvage|rebuilt|flood|lemon|frame damage|broken|cracked screen|for parts)\b/.test(blob)) {
    condition = 0;
    reasons.push("Condition language is a negative signal");
  } else if (/\b(clean title|one owner|service records|garage kept|like new|open box|unused)\b/.test(blob)) {
    condition = 5;
    reasons.push("Positive condition signals in the listing");
  }

  let total = priceScore + mileageScore + yearScore + freshness + completeness + condition;

  if (!market.marketPrice) {
    total = Math.min(total, 55);
  }

  total = Math.max(0, Math.min(100, total));

  return {
    total,
    price: priceScore,
    mileage: mileageScore,
    year: yearScore,
    freshness,
    completeness,
    condition,
    hasMarketData: market.marketPrice != null,
    reasons,
  };
}

export function dealScoreLabel(score: number | null | undefined) {
  if (score == null) return "Unscored";
  if (score >= 85) return "Strong Deal";
  if (score >= 70) return "Good Deal";
  if (score >= 45) return "Average";
  return "Above Market";
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
