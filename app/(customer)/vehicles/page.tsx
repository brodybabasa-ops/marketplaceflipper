import { CustomerGarage } from "@/components/garage/customer-garage";
import { requireSession } from "@/lib/guards";
import { getCustomerGarage } from "@/services/customer-garage";

export const metadata = { title: "My Garage" };

export default async function VehiclesPage() {
  const session = await requireSession("CUSTOMER");
  const garage = await getCustomerGarage(session.id);
  return <CustomerGarage vehicles={garage.vehicles} maintenance={garage.maintenance} insights={garage.insights} />;
}
