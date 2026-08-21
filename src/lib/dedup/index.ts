import type { Listing } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

type ListingSignals = Pick<
  Listing,
  | "id"
  | "source"
  | "sourceListingId"
  | "vin"
  | "title"
  | "price"
  | "mileage"
  | "year"
  | "normalizedMake"
  | "normalizedModel"
  | "city"
  | "state"
  | "sellerName"
  | "imageUrls"
>;

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function duplicateConfidence(a: ListingSignals, b: ListingSignals) {
  if (a.id === b.id) return { confidence: 0, signals: [] as string[] };
  const signals: string[] = [];
  let score = 0;

  if (a.vin && b.vin && a.vin === b.vin) {
    signals.push("vin");
    score += 0.7;
  }

  if (
    a.normalizedMake &&
    b.normalizedMake &&
    a.normalizedMake === b.normalizedMake &&
    a.normalizedModel === b.normalizedModel
  ) {
    signals.push("make_model");
    score += 0.15;
  }

  if (a.year && b.year && a.year === b.year) {
    signals.push("year");
    score += 0.08;
  }

  if (a.price && b.price && Math.abs(a.price - b.price) / Math.max(a.price, b.price) <= 0.02) {
    signals.push("price");
    score += 0.12;
  }

  if (
    a.mileage &&
    b.mileage &&
    Math.abs(a.mileage - b.mileage) / Math.max(a.mileage, b.mileage) <= 0.03
  ) {
    signals.push("mileage");
    score += 0.12;
  }

  if (a.city && b.city && a.city === b.city && a.state === b.state) {
    signals.push("location");
    score += 0.08;
  }

  if (a.sellerName && b.sellerName && a.sellerName === b.sellerName) {
    signals.push("seller");
    score += 0.08;
  }

  if (normalizeTitle(a.title) === normalizeTitle(b.title)) {
    signals.push("title");
    score += 0.1;
  }

  const sharedImages = a.imageUrls.filter((url) => b.imageUrls.includes(url));
  if (sharedImages.length > 0) {
    signals.push("image");
    score += 0.2;
  }

  return { confidence: Math.min(1, Number(score.toFixed(2))), signals };
}

export async function flagDuplicates(listing: ListingSignals) {
  const where = listing.vin
    ? { OR: [{ vin: listing.vin }, { normalizedMake: listing.normalizedMake, normalizedModel: listing.normalizedModel }] }
    : { normalizedMake: listing.normalizedMake, normalizedModel: listing.normalizedModel };

  const candidates = await prisma.listing.findMany({
    where: {
      id: { not: listing.id },
      listingStatus: "active",
      ...where,
    },
    take: 25,
  });

  let flagged = 0;
  for (const candidate of candidates) {
    const { confidence, signals } = duplicateConfidence(listing, candidate);
    if (confidence < 0.55) continue;

    await prisma.duplicateFlag.upsert({
      where: {
        listingId_duplicateOfId: {
          listingId: listing.id,
          duplicateOfId: candidate.id,
        },
      },
      create: {
        listingId: listing.id,
        duplicateOfId: candidate.id,
        confidence,
        signals,
      },
      update: { confidence, signals },
    });
    flagged += 1;
    logger.info("duplicate.flagged", {
      listingId: listing.id,
      duplicateOfId: candidate.id,
      confidence,
      signals,
    });
  }

  return flagged;
}
