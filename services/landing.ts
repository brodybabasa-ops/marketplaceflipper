import { prisma } from "@/lib/db";
import {
  earliestAvailabilityLabel,
  FEATURED_SHOP_SLUGS,
  formatShortMiles,
  formatReviewer,
  specialtyLabel,
  isOpenNow,
  shopPhotoFor,
} from "@/lib/landing";
import { searchMechanics } from "@/services/search";
import type { MechanicMatch } from "@/services/matching";

export type FeaturedShop = {
  slug: string;
  businessName: string;
  averageRating: number;
  reviewCount: number;
  distanceLabel: string;
  city: string;
  state: string;
  specialties: string[];
  verified: boolean;
  availabilityLabel: string;
  photo: string;
};

export type LandingReview = {
  id: string;
  body: string;
  rating: number;
  reviewer: string;
  detail: string;
};

export async function getLandingShowcase() {
  const { matches, zip } = await searchMechanics({ zip: "84041", sort: "closest" });
  const preferred = FEATURED_SHOP_SLUGS.map((slug) => matches.find((item) => item.slug === slug)).filter(
    (item): item is (typeof matches)[number] => Boolean(item),
  );
  const featuredSet = new Set<string>(FEATURED_SHOP_SLUGS);
  const featuredMatches = [...preferred, ...matches.filter((item) => !featuredSet.has(item.slug))].slice(0, 4);
  const extras = featuredMatches.length
    ? await prisma.mechanicProfile.findMany({
        where: { id: { in: featuredMatches.map((item) => item.id) } },
        select: {
          id: true,
          tagline: true,
          shopCity: true,
          shopState: true,
          availability: { select: { dayOfWeek: true, startTime: true, endTime: true } },
        },
      })
    : [];
  const extraById = new Map(extras.map((item) => [item.id, item]));

  const shops: FeaturedShop[] = featuredMatches.map((shop) => {
    const extra = extraById.get(shop.id);
    return {
      slug: shop.slug,
      businessName: shop.businessName,
      averageRating: shop.averageRating,
      reviewCount: shop.reviewCount,
      distanceLabel: formatShortMiles(shop.distanceMiles),
      city: extra?.shopCity ?? zip?.city ?? "Layton",
      state: extra?.shopState ?? zip?.stateCode ?? "UT",
      specialties: specialtyChips(extra?.tagline, shop.specialties),
      verified: shop.verificationLevel !== "UNVERIFIED",
      availabilityLabel: earliestAvailabilityLabel(extra?.availability ?? []),
      photo: shopPhotoFor(shop.slug),
    };
  });

  const reviewRows = await prisma.review.findMany({
    where: { hidden: false },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      job: { include: { vehicle: { include: { make: true, model: true } } } },
    },
    orderBy: [{ overallRating: "desc" }, { createdAt: "desc" }],
    take: 40,
  });

  const seen = new Set<string>();
  const reviews: LandingReview[] = [];
  for (const review of reviewRows) {
    const key = `${review.customerId}:${review.body}`;
    if (seen.has(key) || seen.has(review.body)) continue;
    seen.add(key);
    seen.add(review.body);
    const vehicle = review.job.vehicle;
    reviews.push({
      id: review.id,
      body: review.body,
      rating: review.overallRating,
      reviewer: formatReviewer(review.customer.firstName, review.customer.lastName),
      detail: vehicle ? `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}` : "Verified repair",
    });
    if (reviews.length === 3) break;
  }

  return { shops, reviews, locationLabel: zip ? `${zip.city}, ${zip.stateCode}` : "Layton, UT" };
}

export type DirectoryShop = FeaturedShop & {
  id: string;
  distanceMiles: number;
  openNow: boolean;
  sponsored: boolean;
  latitude: number;
  longitude: number;
  serviceMode: MechanicMatch["serviceMode"];
};

export async function getDirectoryShops(query: Parameters<typeof searchMechanics>[0]) {
  const { matches, zip, category } = await searchMechanics(query);
  const extras = matches.length
    ? await prisma.mechanicProfile.findMany({
        where: { id: { in: matches.map((item) => item.id) } },
        select: {
          id: true,
          tagline: true,
          shopCity: true,
          shopState: true,
          availability: { select: { dayOfWeek: true, startTime: true, endTime: true } },
        },
      })
    : [];
  const extraById = new Map(extras.map((item) => [item.id, item]));
  const shops: DirectoryShop[] = matches.map((shop) => {
    const extra = extraById.get(shop.id);
    return {
      id: shop.id,
      slug: shop.slug,
      businessName: shop.businessName,
      averageRating: shop.averageRating,
      reviewCount: shop.reviewCount,
      distanceMiles: shop.distanceMiles,
      distanceLabel: formatShortMiles(shop.distanceMiles),
      city: extra?.shopCity ?? zip?.city ?? "Layton",
      state: extra?.shopState ?? zip?.stateCode ?? "UT",
      specialties: specialtyChips(extra?.tagline, shop.specialties),
      verified: shop.verificationLevel !== "UNVERIFIED",
      sponsored: shop.isSponsored,
      availabilityLabel: earliestAvailabilityLabel(extra?.availability ?? []),
      openNow: isOpenNow(extra?.availability ?? []),
      photo: shopPhotoFor(shop.slug),
      latitude: shop.latitude,
      longitude: shop.longitude,
      serviceMode: shop.serviceMode,
    };
  });
  return {
    shops,
    zip,
    category,
    locationLabel: zip ? `${zip.city}, ${zip.stateCode}` : "Layton, UT",
  };
}

function specialtyChips(tagline: string | null | undefined, categories: string[]) {
  if (tagline) {
    return tagline
      .split("·")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  return categories.slice(0, 2).map(specialtyLabel);
}
