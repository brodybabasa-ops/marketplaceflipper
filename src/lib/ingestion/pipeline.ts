import type { Prisma } from "@prisma/client";
import type { RawListing } from "@/types/listing";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { normalizeListing } from "@/lib/normalization";
import { flagDuplicates } from "@/lib/dedup";
import { estimateMarketPrice, isComparable, scoreDeal } from "@/lib/scoring/deal-score";
import { listingMatchesParams } from "@/lib/search/query";
import { getSource } from "@/sources";
import { dispatchListingAlert } from "@/lib/notifications/dispatch";

function isValidRaw(raw: RawListing) {
  return Boolean(raw.source && raw.sourceListingId && raw.sourceUrl && raw.title);
}

export async function ingestSource(sourceName = "mock") {
  const source = getSource(sourceName);
  const job = await prisma.ingestionJob.create({
    data: { source: source.name, status: "running" },
  });

  logger.info("ingestion.started", { source: source.name, jobId: job.id });

  let listingsFound = 0;
  let listingsCreated = 0;
  let listingsUpdated = 0;
  let listingsFailed = 0;
  let duplicatesFlagged = 0;
  const createdIds: string[] = [];

  try {
    const rawListings = await source.searchListings({});
    listingsFound = rawListings.length;

    for (const raw of rawListings) {
      try {
        if (!isValidRaw(raw)) {
          listingsFailed += 1;
          logger.warn("ingestion.invalid_listing", {
            source: raw.source,
            sourceListingId: raw.sourceListingId,
          });
          continue;
        }

        const normalized = await normalizeListing(raw);
        const firstSeenAt = raw.listedAt ? new Date(raw.listedAt) : new Date();
        const data: Prisma.ListingCreateInput = {
          source: raw.source,
          sourceListingId: raw.sourceListingId,
          sourceUrl: raw.sourceUrl,
          title: raw.title,
          description: raw.description ?? null,
          price: raw.price ?? null,
          year: normalized.year,
          make: raw.make ?? normalized.make,
          model: raw.model ?? normalized.model,
          trim: raw.trim ?? normalized.trim,
          mileage: raw.mileage ?? normalized.mileage,
          condition: raw.condition ?? normalized.condition,
          city: raw.city ?? null,
          state: raw.state ?? null,
          zipCode: raw.zipCode ?? null,
          latitude: raw.latitude ?? null,
          longitude: raw.longitude ?? null,
          sellerType: raw.sellerType ?? "unknown",
          sellerName: raw.sellerName ?? null,
          imageUrls: raw.imageUrls ?? [],
          vin: raw.vin ?? null,
          listingStatus: "active",
          normalizedMake: normalized.make,
          normalizedModel: normalized.model,
          normalizedTrim: normalized.trim,
          drivetrain: normalized.drivetrain,
          transmission: normalized.transmission,
          fuelType: normalized.fuelType,
          bodyStyle: normalized.bodyStyle,
          engine: normalized.engine,
          normalizationConfidence: normalized.confidence,
          lastSeenAt: new Date(),
        };

        const existing = await prisma.listing.findUnique({
          where: {
            source_sourceListingId: {
              source: raw.source,
              sourceListingId: raw.sourceListingId,
            },
          },
        });

        if (existing) {
          const priceChanged = existing.price != null && data.price != null && existing.price !== data.price;
          const updated = await prisma.listing.update({
            where: { id: existing.id },
            data: {
              ...data,
              firstSeenAt: existing.firstSeenAt,
            },
          });
          if (priceChanged && data.price != null) {
            await prisma.priceHistory.create({
              data: { listingId: updated.id, price: data.price },
            });
          }
          listingsUpdated += 1;
          logger.info("listing.updated", { id: updated.id, source: updated.source });
          duplicatesFlagged += await flagDuplicates(updated);
        } else {
          const created = await prisma.listing.create({
            data: {
              ...data,
              firstSeenAt,
            },
          });
          if (created.price != null) {
            await prisma.priceHistory.create({
              data: { listingId: created.id, price: created.price },
            });
          }
          listingsCreated += 1;
          createdIds.push(created.id);
          logger.info("listing.created", { id: created.id, source: created.source });
          duplicatesFlagged += await flagDuplicates(created);
        }
      } catch (error) {
        listingsFailed += 1;
        logger.error("ingestion.listing_failed", {
          source: raw.source,
          sourceListingId: raw.sourceListingId,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    await rescoreActiveListings();
    await matchNewListings(createdIds);

    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        listingsFound,
        listingsCreated,
        listingsUpdated,
        listingsFailed,
        duplicatesFlagged,
      },
    });

    logger.info("ingestion.completed", {
      source: source.name,
      listingsFound,
      listingsCreated,
      listingsUpdated,
      listingsFailed,
    });

    return { jobId: job.id, listingsFound, listingsCreated, listingsUpdated, listingsFailed, duplicatesFlagged };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: { status: "failed", finishedAt: new Date(), error: message, listingsFound, listingsCreated, listingsUpdated, listingsFailed },
    });
    logger.error("ingestion.failed", { source: sourceName, error: message });
    throw error;
  }
}

export async function rescoreActiveListings() {
  const listings = await prisma.listing.findMany({ where: { listingStatus: "active" } });
  for (const listing of listings) {
    const comparables = listings.filter((candidate) => candidate.id !== listing.id && isComparable(listing, candidate));
    const market = estimateMarketPrice(listing, comparables);
    const breakdown = scoreDeal(listing, comparables);
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        dealScore: breakdown.total,
        dealScoreBreakdown: breakdown,
        marketPrice: market.marketPrice,
        marketPriceDelta: market.delta,
        marketSampleSize: market.sampleSize,
      },
    });
  }
}

async function matchNewListings(listingIds: string[]) {
  if (listingIds.length === 0) return;
  const listings = await prisma.listing.findMany({ where: { id: { in: listingIds } } });
  const searches = await prisma.savedSearch.findMany({ include: { user: true } });

  for (const listing of listings) {
    for (const search of searches) {
      const params = search.params as Partial<import("@/types/search").SearchParams>;
      if (!listingMatchesParams(listing, params)) continue;
      await dispatchListingAlert({ listing, search });
    }
  }
}
