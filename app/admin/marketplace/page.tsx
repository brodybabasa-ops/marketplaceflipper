import { AppNav, ADMIN_NAV } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { marketplaceCoverage } from "@/services/hq";

export const metadata = { title: "Marketplace" };

export default async function MarketplaceHqPage() {
  await requireSession(staffRoles());
  const [total, matched, accepted, completed] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { status: { not: "OPEN" } } }),
    prisma.serviceRequest.count({ where: { status: "ACCEPTED" } }),
    prisma.job.count({ where: { status: "COMPLETED" } }),
  ]);
  const byCity = await prisma.serviceRequest.groupBy({ by: ["city"], _count: { _all: true } });
  const coverage = await marketplaceCoverage();
  return (
    <div>
      <AppNav items={ADMIN_NAV} current="/admin/marketplace" />
      <h1 className="text-3xl font-bold text-ink">Marketplace health</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Total requests", total],
          ["Matched", `${total ? Math.round((matched / total) * 100) : 0}%`],
          ["Accepted", accepted],
          ["Completed jobs", completed],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="number mt-1 text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold">Coverage by industry</h2>
        <p className="mt-1 text-xs text-muted">Use this to recruit where demand outruns supply. Automotive stays the launch focus.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {coverage.map((item) => (
            <li key={item.key} className="flex flex-wrap items-center justify-between gap-2">
              <span>{item.name}</span>
              <span className="text-muted">
                {item.coverage} · {item.providers} providers · {item.verifiedProviders} verified · {item.demand} requests
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold">Demand by city</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {byCity
            .filter((item) => item.city)
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 8)
            .map((item) => (
              <li key={item.city} className="flex justify-between">
                <span>{item.city}</span>
                <span className="number text-muted">{item._count._all} requests</span>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
