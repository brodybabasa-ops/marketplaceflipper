import Link from "next/link";
import { HqAppNav } from "@/components/layout/app-nav";
import { Badge, Card, EmptyState, KpiCard } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { getHqDashboard } from "@/services/hq";
import { hqAttentionCenter } from "@/services/attention";
import { formatCents } from "@/lib/money";
import { staffRoles } from "@/lib/permissions";

export const metadata = { title: "HQ Attention Center" };

export default async function AdminDashboardPage() {
  const session = await requireSession(staffRoles());
  const [data, attention] = await Promise.all([getHqDashboard(), hqAttentionCenter()]);
  return (
    <div>
      <HqAppNav current="/admin" />
      <h1 className="text-3xl font-bold text-ink">What needs Pocket Mechanic’s attention?</h1>
      <p className="mt-1 text-sm text-muted">Exceptions first. Search is still in the header when you need a specific record.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Customers" value={data.metrics.customers} />
        <KpiCard label="Providers" value={data.metrics.providers} />
        <KpiCard label="Active repairs" value={data.metrics.active} />
        <KpiCard label="GMV" value={formatCents(data.metrics.gmvCents)} hint={`${formatCents(data.metrics.revenueCents)} platform revenue`} />
        <KpiCard label="Verified providers" value={data.metrics.verified} />
        <KpiCard label="Open claims" value={attention.disputes.length} />
      </div>
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">Attention Center</h2>
        <div className="mt-3 space-y-2">
          {attention.computed.length === 0 ? (
            <EmptyState title="Queue is clear" body="Unserved demand, Assurance claims, failed payments, and verification work will surface here." />
          ) : (
            attention.computed.map((item) =>
              item ? (
                <Link key={item.href + item.title} href={item.href} className="block">
                  <Card className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-ink">{item.title}</p>
                      {"fixture" in item && item.fixture ? <p className="text-xs text-warning">Development fixture</p> : null}
                    </div>
                    <Badge tone={item.severity === "danger" ? "danger" : item.severity === "warning" ? "warning" : "accent"}>{item.kind.replaceAll("_", " ")}</Badge>
                  </Card>
                </Link>
              ) : null,
            )
          )}
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Marketplace coverage</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {attention.coverage.map((item) => (
              <li key={item.key} className="flex justify-between gap-3">
                <span>{item.name}</span>
                <span className="text-muted">{item.coverage}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Top requested services</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.byCategory
              .sort((a, b) => b._count._all - a._count._all)
              .slice(0, 6)
              .map((item) => (
                <li key={item.category} className="flex justify-between">
                  <span className="text-muted">{item.category.replaceAll("_", " ").toLowerCase()}</span>
                  <span className="number">{item._count._all}</span>
                </li>
              ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
