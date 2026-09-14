import { DirectoryPage } from "@/components/mechanics/directory-page";
import { CustomerFindView } from "@/components/customer-app/find-view";
import { getDirectoryShops } from "@/services/landing";
import { one } from "@/services/search";
import { LANDING_LOCATION } from "@/lib/landing";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Find a Shop" };

export default async function MechanicsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const zipDefault =
    session?.role === "CUSTOMER"
      ? ((await prisma.customerProfile.findUnique({ where: { userId: session.id } }))?.zip ?? LANDING_LOCATION)
      : LANDING_LOCATION;
  const query = {
    q: one(params.q),
    zip: one(params.zip) ?? zipDefault,
    vehicle: one(params.vehicle),
    vehicleType: one(params.vehicleType) ?? "truck",
    category: one(params.category),
    make: one(params.make),
    mode: one(params.mode),
    rating: one(params.rating),
    distance: one(params.distance) ?? "50",
    sort: one(params.sort) ?? "closest",
  };
  const { shops, zip, locationLabel } = await getDirectoryShops(query);
  if (session?.role === "CUSTOMER") {
    const saved = await prisma.savedMechanic.findMany({
      where: { customerId: session.id },
      select: { mechanicProfileId: true },
    });
    return (
      <CustomerFindView
        query={{
          q: query.q,
          zip: query.zip,
          type: one(params.type),
          category: query.category,
          distance: query.distance,
          rating: query.rating,
          sort: query.sort,
          view: one(params.view),
        }}
        shops={shops}
        savedIds={saved.map((item) => item.mechanicProfileId)}
        origin={zip ? { latitude: zip.latitude, longitude: zip.longitude, city: zip.city } : null}
        locationLabel={locationLabel}
      />
    );
  }
  return (
    <DirectoryPage
      query={query}
      shops={shops}
      locationLabel={locationLabel}
      origin={zip ? { latitude: zip.latitude, longitude: zip.longitude, city: zip.city } : null}
    />
  );
}
