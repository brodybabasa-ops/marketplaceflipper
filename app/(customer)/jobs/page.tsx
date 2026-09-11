import { requireSession } from "@/lib/guards";
import { getCustomerRepairs, type RepairTab } from "@/services/customer-repairs";
import { CustomerRepairs } from "@/components/repairs/customer-repairs";

export const metadata = { title: "My Repairs" };

const TABS: RepairTab[] = ["all", "in-progress", "waiting-parts", "waiting-approval", "completed", "cancelled"];

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireSession("CUSTOMER");
  const { tab } = await searchParams;
  const data = await getCustomerRepairs(session.id);
  const activeTab: RepairTab = TABS.includes(tab as RepairTab) ? (tab as RepairTab) : "all";
  return (
    <CustomerRepairs
      rows={data.rows}
      counts={data.counts}
      appointment={data.appointment}
      history={data.history}
      activeTab={activeTab}
    />
  );
}
