import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { Badge, Card, KpiCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { getMechanicCrm } from "@/services/crm";
import { formatCents } from "@/lib/money";
import { dismissRecommendedAction } from "@/app/actions/master";

export const metadata = { title: "Customers" };

export default async function MechanicCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const params = await searchParams;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const crm = await getMechanicCrm(profile.id, session.id, params.q);
  const tab = params.tab ?? "all";
  const rows =
    tab === "followups"
      ? crm.customers.filter((item) => item.nextAction !== "None")
      : tab === "recommended"
        ? crm.customers.filter((item) => item.recommended.length)
        : tab === "vip"
          ? crm.customers.filter((item) => item.lifetimeSpendCents >= 200000 || item.completedJobs >= 4)
          : tab === "inactive"
            ? crm.customers.filter((item) => Date.now() - item.lastVisit.getTime() > 90 * 24 * 3600 * 1000)
            : crm.customers;

  return (
    <div>
      <MechanicAppNav current="/mechanic/customers" />
      <h1 className="text-3xl font-bold text-ink">Customers</h1>
      <p className="mt-2 text-sm text-muted">Jobs populate this list automatically. You should not have to manage a CRM.</p>
      <Button asChild className="mt-4">
        <Link href="/mechanic/customers/today">Work my list</Link>
      </Button>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Need attention" value={crm.attention.recommended + crm.attention.unpaid + crm.attention.estimates} />
        <KpiCard label="Recommended work" value={crm.attention.recommended} />
        <KpiCard label="Unpaid invoices" value={crm.attention.unpaid} />
        <KpiCard label="Potential revenue" value={formatCents(crm.attention.potential)} />
      </div>
      <form className="mt-6">
        <Input name="q" defaultValue={params.q} placeholder="Search name, email, vehicle..." />
      </form>
      <div className="mt-4 flex gap-2 text-sm">
        {[
          ["all", "All customers"],
          ["followups", "Follow-ups"],
          ["recommended", "Recommended work"],
          ["vip", "VIP"],
          ["inactive", "Inactive"],
        ].map(([value, label]) => (
          <Link key={value} href={`/mechanic/customers?tab=${value}`} className={tab === value ? "text-accent" : "text-muted"}>
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2">Customer</th>
              <th>Vehicles</th>
              <th>Last visit</th>
              <th>Next action</th>
              <th>Lifetime spend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="py-3">
                  <Link href={`/mechanic/customers/${item.id}`} className="font-semibold text-ink">
                    {item.name}
                  </Link>
                </td>
                <td className="text-muted">{item.vehicles.slice(0, 2).join(", ")}</td>
                <td className="text-muted">{item.lastVisit.toLocaleDateString()}</td>
                <td>
                  <Badge tone={item.nextAction === "None" ? "muted" : "warning"}>{item.nextAction}</Badge>
                </td>
                <td className="number">{formatCents(item.lifetimeSpendCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crm.recommended.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-ink">Recommended work</h2>
          <div className="mt-3 space-y-2">
            {crm.recommended.slice(0, 8).map((item) => (
              <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-sm text-muted">
                    {item.customer.firstName} · {formatCents(item.estimatedCents)}
                  </p>
                </div>
                <form action={dismissRecommendedAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button size="sm" variant="secondary">
                    Dismiss
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
