import { MechanicAppNav } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { getMechanicAnalytics } from "@/services/analytics";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Analytics" };

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

export default async function MechanicAnalyticsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const analytics = await getMechanicAnalytics(profile.id, session.id);
  const maxJobs = Math.max(...analytics.byMonth.map((item) => item.jobs), 1);
  const maxRevenue = Math.max(...analytics.byMonth.map((item) => item.revenueCents), 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <MechanicAppNav current="/mechanic/analytics" />
      <h1 className="text-3xl font-bold text-ink">Performance</h1>
      <p className="mt-2 text-sm text-muted">These numbers feed Pocket Score. Advertising cannot buy a higher rank.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-muted">Completed jobs</p>
          <p className="number mt-1 text-3xl font-bold text-ink">{analytics.totals.completed}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Request conversion</p>
          <p className="number mt-1 text-3xl font-bold text-ink">{analytics.totals.conversion}%</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">This month</p>
          <p className="number mt-1 text-3xl font-bold text-ink">{formatCents(analytics.totals.monthRevenueCents)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Would use again</p>
          <p className="number mt-1 text-3xl font-bold text-ink">{analytics.ratings.wouldUseAgain}%</p>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold text-ink">Jobs by month</h2>
          {analytics.byMonth.map((item) => (
            <Bar key={item.label} label={item.label} value={item.jobs} max={maxJobs} />
          ))}
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold text-ink">Volume by month</h2>
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
      <Card className="mt-6 grid gap-3 p-5 sm:grid-cols-3">
        {[
          ["Communication", analytics.ratings.communication],
          ["Professionalism", analytics.ratings.professionalism],
          ["Pricing transparency", analytics.ratings.pricing],
          ["Timeliness", analytics.ratings.timeliness],
          ["Quality", analytics.ratings.quality],
          ["Overall", analytics.ratings.overall],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <p className="text-sm text-muted">{label}</p>
            <p className="number text-xl font-semibold text-ink">{Number(value).toFixed(1)}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
