import Link from "next/link";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, KpiCard } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { fleetDashboard } from "@/services/fleet";

export const metadata = { title: "Fleet" };

export default async function FleetPage() {
  const session = await requireSession("CUSTOMER");
  const dashboard = await fleetDashboard(session.id);
  if (!dashboard) {
    return (
      <div>
        <CustomerAppNav current="/fleet" />
        <h1 className="text-3xl font-bold text-ink">Keep my fleet running</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Fleet is a dedicated operating surface — not a bigger garage. Sign in as the fleet demo account to see assigned assets, downtime, and spend.
        </p>
        <div className="mt-6">
          <EmptyState title="No fleet account on this login" body="Ask HQ to attach this user to a fleet, or preview the fleet demo role from the product review center.">
            <Button asChild>
              <Link href="/dev/preview">Role preview</Link>
            </Button>
          </EmptyState>
        </div>
      </div>
    );
  }
  return (
    <div>
      <CustomerAppNav current="/fleet" />
      <h1 className="text-3xl font-bold text-ink">{dashboard.fleet.name}</h1>
      <p className="mt-1 text-sm text-muted">Keep my fleet running. Same assets, jobs, and providers as the rest of Pocket Mechanic.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Assets" value={dashboard.kpis.assets} />
        <KpiCard label="Need service" value={dashboard.kpis.needService} />
        <KpiCard label="Down" value={dashboard.kpis.down} />
        <KpiCard label="Maintenance YTD" value={dashboard.kpis.ytdLabel} hint={`Avg ${dashboard.kpis.avgCost} / asset`} />
      </div>
      <div className="mt-8 space-y-3">
        {dashboard.rows.map((row) => (
          <div key={row.assetId} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4">
            <Link href={`/vehicles/${row.assetId}`} className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{row.label ? `${row.label} · ${row.title}` : row.title}</p>
              <p className="text-sm text-muted">
                {row.industry}
                {row.down ? " · Down" : ""}
                {row.due ? ` · ${row.due} maintenance` : ""}
                {row.provider ? ` · ${row.provider}` : ""}
              </p>
            </Link>
            <Button asChild size="sm">
              <Link href={`/fix?asset=${row.assetId}`}>Fix It</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
