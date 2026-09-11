import { prisma } from "@/lib/db";
import { earliestAvailabilityLabel, formatShortMiles, formatReviewer, SHOP_PHOTOS, specialtyLabel } from "@/lib/landing";
import { searchMechanics } from "@/services/search";

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
  const featuredMatches = matches.slice(0, 4);
  const extras = featuredMatches.length
    ? await prisma.mechanicProfile.findMany({
        where: { id: { in: featuredMatches.map((item) => item.id) } },
        select: {
          id: true,
          shopCity: true,
          shopState: true,
          availability: { select: { dayOfWeek: true, startTime: true, endTime: true } },
        },
      })
    : [];
  const extraById = new Map(extras.map((item) => [item.id, item]));

  const shops: FeaturedShop[] = featuredMatches.map((shop, index) => {
    const extra = extraById.get(shop.id);
    return {
      slug: shop.slug,
      businessName: shop.businessName,
      averageRating: shop.averageRating,
      reviewCount: shop.reviewCount,
      distanceLabel: formatShortMiles(shop.distanceMiles),
      city: extra?.shopCity ?? zip?.city ?? "Layton",
      state: extra?.shopState ?? zip?.stateCode ?? "UT",
      specialties: shop.specialties.slice(0, 2).map(specialtyLabel),
      verified: shop.verificationLevel !== "UNVERIFIED",
      availabilityLabel: earliestAvailabilityLabel(extra?.availability ?? []),
      photo: SHOP_PHOTOS[index % SHOP_PHOTOS.length],
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
