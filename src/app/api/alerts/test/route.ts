import { requireUser } from "@/lib/auth/session";
import { previewAlertsForUser } from "@/lib/notifications/dispatch";
import { httpError, json } from "@/lib/http";
import { vehicleTitle, formatPrice, formatMiles, formatLocation } from "@/lib/utils";

export async function POST() {
  try {
    const user = await requireUser();
    const previews = await previewAlertsForUser(user.id);
    return json({
      items: previews.map((item) => ({
        searchId: item.search.id,
        searchName: item.search.name,
        matches: item.matches.map((listing) => ({
          id: listing.id,
          title: vehicleTitle(listing),
          price: formatPrice(listing.price),
          mileage: formatMiles(listing.mileage),
          location: formatLocation(listing.city, listing.state),
          sourceUrl: listing.sourceUrl,
        })),
      })),
    });
  } catch (error) {
    return httpError(error);
  }
}
