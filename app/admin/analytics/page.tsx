import { AppNav, ADMIN_NAV } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { getPlatformAnalytics } from "@/services/analytics";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Platform analytics" };

function Bar({ value, max, label, display }: { value: number; max: number; label: string; display?: string }) {
  const width = max ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="number">{display ?? value}</span>
      </div>
      <div className="h-2 rounded-full bg-navy-soft">
        <div className="h-2 rounded-full bg-navy" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  await requireSession(["ADMIN", "FINANCE"]);
  const analytics = await getPlatformAnalytics();
  const maxJobs = Math.max(...analytics.byMonth.map((item) => item.jobs), 1);
  const maxRevenue = Math.max(...analytics.byMonth.map((item) => item.revenueCents), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AppNav items={ADMIN_NAV} current="/admin/analytics" />
      <h1 className="text-3xl font-bold text-ink">Platform analytics</h1>
      <p className="mt-2 text-sm text-muted">Users, jobs, disputes, and marketplace volume. Ranking is never sold.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Users", analytics.totals.users],
          ["Mechanics", analytics.totals.mechanics],
          ["Jobs", analytics.totals.jobs],
          ["Completed", analytics.totals.completed],
          ["Open disputes", analytics.totals.openDisputes],
          ["Gross volume", formatCents(analytics.totals.grossCents)],
          ["Platform fees", formatCents(analytics.totals.commissionCents)],
          ["Average rating", analytics.totals.averageRating.toFixed(1)],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="number mt-1 text-3xl font-bold text-ink">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold text-ink">Jobs by month</h2>
          {analytics.byMonth.map((item) => (
            <Bar key={item.label} label={item.label} value={item.jobs} max={maxJobs} />
          ))}
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold text-ink">Paid volume by month</h2>
          {analytics.byMonth.map((item) => (
            <Bar
              key={item.label}
              label={item.label}
              value={item.revenueCents}
              max={maxRevenue}
              display={formatCents(item.revenueCents)}
            />
          ))}
        </Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Users</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {analytics.usersByRole.map((item) => (
              <div key={item.role} className="flex justify-between">
                <dt className="capitalize text-muted">{item.role.toLowerCase()}</dt>
                <dd className="number font-semibold text-ink">{item.count}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Disputes</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {analytics.disputesByStatus.map((item) => (
              <div key={item.status} className="flex justify-between">
                <dt className="capitalize text-muted">{item.status.replaceAll("_", " ").toLowerCase()}</dt>
                <dd className="number font-semibold text-ink">{item.count}</dd>
              </div>
            ))}
            {analytics.disputesByStatus.length === 0 ? <p className="text-sm text-muted">No disputes yet.</p> : null}
          </dl>
        </Card>
      </div>
    </div>
  );
}
