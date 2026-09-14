import { requireSession } from "@/lib/guards";
import { getCustomerDashboard } from "@/services/customer-dashboard";
import { CustomerHomeView } from "@/components/customer-app/home-view";

export const metadata = { title: "Home" };

export default async function CustomerHomePage() {
  const session = await requireSession("CUSTOMER");
  const data = await getCustomerDashboard(session.id);
  return (
    <CustomerHomeView
      vehicles={data.vehicles}
      shops={data.shops}
      savedShopIds={data.savedShopIds}
      reviews={data.reviews}
      location={data.locationLabel}
      zip={data.zip}
    />
  );
}
