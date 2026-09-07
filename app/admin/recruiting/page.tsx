import { HqAppNav } from "@/components/layout/app-nav";
import { Card, EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { marketplaceHealth } from "@/services/attention";
import { DemoBanner } from "@/components/ui/vision";
import { staffRoles } from "@/lib/permissions";

export const metadata = { title: "Providers needed" };

export default async function RecruitingPage() {
  await requireSession(staffRoles());
  const health = await marketplaceHealth();
  const needed = health.fixtures?.providersNeeded ?? [];
  return (
    <div>
      <HqAppNav current="/admin/recruiting" />
      <h1 className="text-3xl font-bold text-ink">Providers needed</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Recruit from actual demand: request volume, acceptance, wait times, and verified coverage. Organic ranking still cannot be bought.
      </p>
      <div className="mt-4">
        <DemoBanner />
      </div>
      <div className="mt-6 space-y-3">
        {needed.length === 0 ? (
          <EmptyState title="No recruiting fixtures in this environment" body="Live shortages appear when coverage is low relative to unmatched requests." />
        ) : (
          needed.map((item) => (
            <Card key={item.market} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.market}</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">{item.need}</h2>
              <p className="mt-2 text-sm text-muted">{item.reason}</p>
              <p className="mt-2 text-sm">Demand {item.demand} · Coverage {item.coverage}</p>
            </Card>
          ))
        )}
      </div>
      {health.fixtures?.marketplace ? (
        <section className="mt-8">
          <h2 className="font-semibold text-ink">Seasonal demand fixtures</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {health.fixtures.marketplace.map((item) => (
              <li key={item.metric + item.market} className="rounded-2xl border border-line bg-card p-4">
                {item.market} · {item.industry} · {item.metric}: {item.value}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
