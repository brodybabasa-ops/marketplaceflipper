import { CustomerGarageView } from "@/components/customer-app/garage-view";
import { requireSession } from "@/lib/guards";
import { getCustomerGarage } from "@/services/customer-garage";

export const metadata = { title: "My Garage" };

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const session = await requireSession("CUSTOMER");
  const { kind } = await searchParams;
  const garage = await getCustomerGarage(session.id);
  return <CustomerGarageView vehicles={garage.vehicles} counts={garage.counts} kind={kind ?? "all"} />;
}
