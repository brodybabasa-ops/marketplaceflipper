import { Prisma, type Listing } from "@prisma/client";
import type { SearchParams, SearchResult } from "@/types/search";
import { prisma } from "@/lib/db/prisma";
import { boundingBox, haversineMiles } from "@/lib/geo";
import { logger } from "@/lib/logger";

const SORT_MAP: Record<string, Prisma.ListingOrderByWithRelationInput> = {
  newest: { firstSeenAt: "desc" },
  oldest: { firstSeenAt: "asc" },
  priceLow: { price: "asc" },
  priceHigh: { price: "desc" },
  mileageLow: { mileage: "asc" },
  yearNewest: { year: "desc" },
  dealScore: { dealScore: "desc" },
};

export function listingWhere(params: SearchParams): Prisma.ListingWhereInput {
  const AND: Prisma.ListingWhereInput[] = [{ listingStatus: "active" }];

  if (params.keyword) {
    AND.push({
      OR: [
        { title: { contains: params.keyword, mode: "insensitive" } },
        { description: { contains: params.keyword, mode: "insensitive" } },
        { normalizedMake: { contains: params.keyword, mode: "insensitive" } },
        { normalizedModel: { contains: params.keyword, mode: "insensitive" } },
      ],
    });
  }
  if (params.make) AND.push({ normalizedMake: { equals: params.make, mode: "insensitive" } });
  if (params.model) AND.push({ normalizedModel: { equals: params.model, mode: "insensitive" } });
  if (params.yearMin) AND.push({ year: { gte: params.yearMin } });
  if (params.yearMax) AND.push({ year: { lte: params.yearMax } });
  if (params.priceMin) AND.push({ price: { gte: params.priceMin } });
  if (params.priceMax) AND.push({ price: { lte: params.priceMax } });
  if (params.mileageMin) AND.push({ mileage: { gte: params.mileageMin } });
  if (params.mileageMax) AND.push({ mileage: { lte: params.mileageMax } });
  if (params.bodyStyle) AND.push({ bodyStyle: { equals: params.bodyStyle, mode: "insensitive" } });
  if (params.drivetrain) AND.push({ drivetrain: { equals: params.drivetrain, mode: "insensitive" } });
  if (params.transmission) AND.push({ transmission: { equals: params.transmission, mode: "insensitive" } });
  if (params.fuelType) AND.push({ fuelType: { equals: params.fuelType, mode: "insensitive" } });
  if (params.sellerType) AND.push({ sellerType: params.sellerType });
  if (params.source) AND.push({ source: params.source });

  if (params.latitude != null && params.longitude != null && params.radius) {
    const box = boundingBox(
      { latitude: params.latitude, longitude: params.longitude },
      params.radius,
    );
    AND.push({
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLon, lte: box.maxLon },
    });
  } else if (params.location) {
    AND.push({
      OR: [
        { city: { contains: params.location, mode: "insensitive" } },
        { state: { contains: params.location, mode: "insensitive" } },
      ],
    });
  }

  return { AND };
}

export function listingMatchesParams(
  listing: Listing,
  params: Partial<SearchParams>,
) {
  if (listing.listingStatus !== "active") return false;
  if (params.make && listing.normalizedMake?.toLowerCase() !== params.make.toLowerCase()) return false;
  if (params.model && listing.normalizedModel?.toLowerCase() !== params.model.toLowerCase()) return false;
  if (params.yearMin && (listing.year == null || listing.year < params.yearMin)) return false;
  if (params.yearMax && (listing.year == null || listing.year > params.yearMax)) return false;
  if (params.priceMin && (listing.price == null || listing.price < params.priceMin)) return false;
  if (params.priceMax && (listing.price == null || listing.price > params.priceMax)) return false;
  if (params.mileageMin && (listing.mileage == null || listing.mileage < params.mileageMin)) return false;
  if (params.mileageMax && (listing.mileage == null || listing.mileage > params.mileageMax)) return false;
  if (params.bodyStyle && listing.bodyStyle?.toLowerCase() !== params.bodyStyle.toLowerCase()) return false;
  if (params.drivetrain && listing.drivetrain?.toLowerCase() !== params.drivetrain.toLowerCase()) return false;
  if (params.transmission && listing.transmission?.toLowerCase() !== params.transmission.toLowerCase()) return false;
  if (params.fuelType && listing.fuelType?.toLowerCase() !== params.fuelType.toLowerCase()) return false;
  if (params.sellerType && listing.sellerType !== params.sellerType) return false;
  if (params.source && listing.source !== params.source) return false;
  if (params.keyword) {
    const blob = `${listing.title} ${listing.description ?? ""} ${listing.normalizedMake ?? ""} ${listing.normalizedModel ?? ""}`.toLowerCase();
    if (!blob.includes(params.keyword.toLowerCase())) return false;
  }
  if (params.latitude != null && params.longitude != null && params.radius) {
    if (listing.latitude == null || listing.longitude == null) return false;
    const miles = haversineMiles(
      { latitude: params.latitude, longitude: params.longitude },
      { latitude: listing.latitude, longitude: listing.longitude },
    );
    if (miles > params.radius) return false;
  }
  return true;
}

export async function searchListings(params: SearchParams): Promise<SearchResult<Listing>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const where = listingWhere(params);
  const orderBy = SORT_MAP[params.sort ?? "newest"] ?? SORT_MAP.newest;

  const [total, rows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: Math.min(50, Math.max(1, pageSize) * 2),
    }),
  ]);

  const items =
    params.latitude != null && params.longitude != null && params.radius
      ? rows.filter((listing) => {
          if (listing.latitude == null || listing.longitude == null) return false;
          return (
            haversineMiles(
              { latitude: params.latitude!, longitude: params.longitude! },
              { latitude: listing.latitude, longitude: listing.longitude },
            ) <= params.radius!
          );
        })
      : rows;

  const paged = items.slice(0, pageSize);

  logger.info("search.executed", {
    resultCount: total,
    page,
    sort: params.sort ?? "newest",
  });

  await prisma.searchEvent.create({
    data: { params: params as object, resultCount: total },
  });

  return {
    items: paged,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
