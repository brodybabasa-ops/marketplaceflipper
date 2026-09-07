import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { jobAssetLabel } from "@/lib/asset-display";

export const metadata = { title: "Estimates" };

export default async function MechanicEstimatesPage() {
  const session = await requireSession("MECHANIC");
  const estimates = await prisma.estimate.findMany({
    where: { mechanicId: session.id },
    include: { job: { include: { customer: true, vehicle: { include: { make: true, model: true } }, asset: true } }, repairGroups: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return (
    <div>
      <MechanicAppNav current="/mechanic/estimates" />
      <h1 className="text-3xl font-bold text-ink">Estimates</h1>
      <div className="mt-6 space-y-3">
        {estimates.map((estimate) => (
          <Link key={estimate.id} href={`/mechanic/jobs/${estimate.jobId}?tab=estimate`} className="block rounded-2xl border border-line bg-card p-4">
            <p className="font-semibold text-ink">
              {jobAssetLabel(estimate.job)} · {estimate.job.customer.firstName}
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
