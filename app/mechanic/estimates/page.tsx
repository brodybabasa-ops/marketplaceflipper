import Link from "next/link";
import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Estimates" };

export default async function MechanicEstimatesPage() {
  const session = await requireSession("MECHANIC");
  const estimates = await prisma.estimate.findMany({
    where: { mechanicId: session.id },
    include: { job: { include: { customer: true, vehicle: { include: { make: true, model: true } } } }, repairGroups: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return (
    <div>
      <AppNav items={MECHANIC_NAV} current="/mechanic/estimates" />
      <h1 className="text-3xl font-bold text-ink">Estimates</h1>
      <div className="mt-6 space-y-3">
        {estimates.map((estimate) => (
          <Link key={estimate.id} href={`/mechanic/jobs/${estimate.jobId}?tab=estimate`} className="block rounded-2xl border border-line bg-card p-4">
            <p className="font-semibold text-ink">
              {estimate.job.vehicle.year} {estimate.job.vehicle.make.name} · {estimate.job.customer.firstName}
            </p>
            <p className="text-sm text-muted">
              {estimate.type === "CHANGE_ORDER" ? "Supplemental" : "Estimate"} · {estimate.status.toLowerCase()} · {formatCents(estimate.totalCents)}
              {estimate.repairGroups.length ? ` · ${estimate.repairGroups.length} repair groups` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
