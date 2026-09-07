import Link from "next/link";
import { AppNav, ADMIN_NAV } from "@/components/layout/app-nav";
import { Badge, Card, KpiCard } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { getHqDashboard } from "@/services/hq";
import { formatCents } from "@/lib/money";
import { staffRoles } from "@/lib/permissions";

export const metadata = { title: "HQ" };

export default async function AdminDashboardPage() {
  const session = await requireSession(staffRoles());
  const data = await getHqDashboard();
  return (
    <div>
      <AppNav items={ADMIN_NAV} current="/admin" />
      <h1 className="text-3xl font-bold text-ink">Good morning, {session.firstName}.</h1>
      <p className="mt-1 text-sm text-muted">What needs Pocket Mechanic’s attention?</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Customers" value={data.metrics.customers} />
        <KpiCard label="Providers" value={data.metrics.providers} />
        <KpiCard label="Service requests" value={data.metrics.requests} />
        <KpiCard label="Active repairs" value={data.metrics.active} />
        <KpiCard label="GMV" value={formatCents(data.metrics.gmvCents)} hint={`${formatCents(data.metrics.revenueCents)} platform revenue`} />
        <KpiCard label="Verified providers" value={data.metrics.verified} />
      </div>
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">Needs attention</h2>
        <div className="mt-3 space-y-2">
          {data.attention.length === 0 ? (
            <p className="text-sm text-muted">Queue is clear.</p>
          ) : (
            data.attention.map((item) =>
              item ? (
                <Link key={item.href + item.label} href={item.href} className="block">
                  <Card className="flex items-center justify-between p-4">
                    <p className="text-sm text-ink">{item.label}</p>
                    <Badge tone={item.tone === "danger" ? "danger" : item.tone === "warning" ? "warning" : "accent"}>Open</Badge>
                  </Card>
                </Link>
              ) : null,
            )
          )}
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
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
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Top performing providers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.topProviders.map((item) => (
              <li key={item.id} className="flex justify-between">
                <Link href={`/admin/mechanics`} className="text-ink">
                  {item.businessName}
                </Link>
                <span className="text-muted">{item.averageRating.toFixed(2)} · {item.completedJobsCount} jobs</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
