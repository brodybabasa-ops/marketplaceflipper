import { DirectoryPage } from "@/components/mechanics/directory-page";
import { getDirectoryShops } from "@/services/landing";
import { one } from "@/services/search";
import { LANDING_LOCATION } from "@/lib/landing";

export const metadata = { title: "Find a Shop" };

export default async function MechanicsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = {
    q: one(params.q),
    zip: one(params.zip) ?? LANDING_LOCATION,
    vehicle: one(params.vehicle),
    vehicleType: one(params.vehicleType) ?? "truck",
    category: one(params.category),
    make: one(params.make),
    mode: one(params.mode),
    rating: one(params.rating),
    distance: one(params.distance) ?? "50",
    sort: one(params.sort) ?? "recommended",
  };
  const { shops, zip, locationLabel } = await getDirectoryShops(query);
  return (
    <DirectoryPage
      query={query}
      shops={shops}
      locationLabel={locationLabel}
      origin={zip ? { latitude: zip.latitude, longitude: zip.longitude, city: zip.city } : null}
    />
  );
}
