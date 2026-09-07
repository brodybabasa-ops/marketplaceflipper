import { HqAppNav } from "@/components/layout/app-nav";
import { KpiCard } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export const metadata = { title: "Growth" };

export default async function HqGrowthPage() {
  await requireSession(staffRoles());
  const [customers, providers, founding, requests] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.mechanicProfile.count(),
    prisma.mechanicProfile.count({ where: { isFoundingProvider: true } }),
    prisma.serviceRequest.count(),
  ]);
  return (
    <div>
      <HqAppNav current="/admin/growth" />
      <h1 className="text-3xl font-bold text-ink">Growth</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Customers" value={customers} />
        <KpiCard label="Providers" value={providers} />
        <KpiCard label="Founding 100" value={founding} />
        <KpiCard label="Service requests" value={requests} />
      </div>
    </div>
  );
}
