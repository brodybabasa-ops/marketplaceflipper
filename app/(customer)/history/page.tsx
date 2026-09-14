import { CustomerHistoryView } from "@/components/customer-app/history-view";
import { requireSession } from "@/lib/guards";
import { getCustomerHistory } from "@/services/customer-history";

export const metadata = { title: "Repair history" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; q?: string; sort?: string }>;
}) {
  const session = await requireSession("CUSTOMER");
  const params = await searchParams;
  const data = await getCustomerHistory(session.id);
  return (
    <CustomerHistoryView
      rows={data.rows}
      counts={data.counts}
      kind={params.kind ?? "all"}
      q={params.q ?? ""}
      sort={params.sort ?? "newest"}
    />
  );
}
