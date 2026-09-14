import { CustomerSavedView, type SavedShopRow } from "@/components/customer-app/saved-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { getDirectoryShops } from "@/services/landing";
import { shopPhotoFor, formatShortMiles } from "@/lib/landing";
import { haversineMiles } from "@/lib/geo";
import { earliestAvailabilityLabel, isOpenNow } from "@/lib/landing";

export const metadata = { title: "Saved shops" };

export default async function SavedShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; q?: string; sort?: string }>;
}) {
  const session = await requireSession("CUSTOMER");
  const params = await searchParams;
  const [saved, profile] = await Promise.all([
    prisma.savedMechanic.findMany({
      where: { customerId: session.id },
      include: {
        mechanic: {
          include: { availability: true, specialties: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerProfile.findUnique({ where: { userId: session.id } }),
  ]);
  const zip = profile?.zip ?? "84041";
  const { shops } = await getDirectoryShops({ zip, distance: "100", sort: "closest" });
  const byId = new Map(shops.map((shop) => [shop.id, shop]));
  const origin = profile?.latitude != null && profile.longitude != null
    ? { latitude: profile.latitude, longitude: profile.longitude }
    : null;

  const rows: SavedShopRow[] = saved.map((item) => {
    const existing = byId.get(item.mechanicProfileId);
    if (existing) {
      return {
        ...existing,
        savedAt: item.createdAt,
        tagline: item.mechanic.tagline,
        serviceLabel: item.mechanic.serviceMode === "MOBILE" ? "Mobile" : "In Shop",
      };
    }
    const miles = origin
      ? haversineMiles(origin, { latitude: item.mechanic.latitude, longitude: item.mechanic.longitude })
      : Number.NaN;
    return {
      id: item.mechanic.id,
      slug: item.mechanic.slug,
      businessName: item.mechanic.businessName,
      averageRating: item.mechanic.averageRating,
      reviewCount: item.mechanic.reviewCount,
      distanceMiles: Number.isFinite(miles) ? miles : 99,
      distanceLabel: Number.isFinite(miles) ? formatShortMiles(miles) : "",
      city: item.mechanic.shopCity ?? "",
      state: item.mechanic.shopState ?? "",
      specialties: item.mechanic.tagline?.split("·").map((part) => part.trim()).filter(Boolean).slice(0, 3) ?? [],
      verified: item.mechanic.verificationLevel !== "UNVERIFIED",
      availabilityLabel: earliestAvailabilityLabel(item.mechanic.availability),
      photo: shopPhotoFor(item.mechanic.slug),
      openNow: isOpenNow(item.mechanic.availability),
      sponsored: item.mechanic.isSponsored,
      latitude: item.mechanic.latitude,
      longitude: item.mechanic.longitude,
      serviceMode: item.mechanic.serviceMode,
      savedAt: item.createdAt,
      tagline: item.mechanic.tagline,
      serviceLabel: item.mechanic.serviceMode === "MOBILE" ? "Mobile" : "In Shop",
    };
  });

  return <CustomerSavedView shops={rows} kind={params.kind ?? "all"} q={params.q ?? ""} sort={params.sort ?? "recent"} />;
}
