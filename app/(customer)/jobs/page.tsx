import { requireSession } from "@/lib/guards";
import { getCustomerRepairs } from "@/services/customer-repairs";
import { CustomerRepairs } from "@/components/repairs/customer-repairs";

export const metadata = { title: "My Repairs" };

export default async function JobsPage() {
  const session = await requireSession("CUSTOMER");
  const data = await getCustomerRepairs(session.id);
  return (
    <CustomerRepairs rows={data.rows} counts={data.counts} appointment={data.appointment} history={data.history} />
  );
}
