import { requireSession } from "@/lib/guards";
import { getCustomerDashboard } from "@/services/customer-dashboard";
import { CustomerDashboard } from "@/components/home/customer-dashboard";

export const metadata = { title: "Dashboard" };

export default async function CustomerHomePage() {
  const session = await requireSession("CUSTOMER");
  const data = await getCustomerDashboard(session.id);
  return (
    <CustomerDashboard
      firstName={session.firstName}
      vehicles={data.vehicles}
      repairs={data.repairs}
      shops={data.shops}
      origin={data.origin}
      activity={data.activity}
      messages={data.messages}
    />
  );
}
