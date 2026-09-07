import Link from "next/link";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { RepairGroupEstimate } from "@/components/jobs/repair-group-estimate";
import { EstimateCard } from "@/components/jobs/estimate-card";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { jobAssetLabel } from "@/lib/asset-display";

export const metadata = { title: "Estimates" };

export default async function CustomerEstimatesPage() {
  const session = await requireSession("CUSTOMER");
  const estimates = await prisma.estimate.findMany({
    where: { job: { customerId: session.id } },
    include: {
      job: { include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } }, asset: true } },
      lineItems: true,
      approvals: true,
      repairGroups: { include: { lineItems: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <CustomerAppNav current="/estimates" />
      <h1 className="text-3xl font-bold text-ink">Estimates</h1>
      <p className="mt-2 text-sm text-muted">Approve or decline each repair. Approved work cannot be silently changed.</p>
      <div className="mt-6 space-y-4">
        {estimates.length === 0 ? (
          <EmptyState title="No estimates yet" body="After a provider inspects, each repair group appears here for you to approve or decline.">
            <Button asChild>
              <Link href="/jobs">Track repairs</Link>
            </Button>
          </EmptyState>
        ) : null}
        {estimates.map((estimate) => (
          <div key={estimate.id} className="space-y-3">
            <Link href={`/jobs/${estimate.jobId}`} className="block text-sm text-accent">
              {estimate.job.mechanicProfile.businessName} · {jobAssetLabel(estimate.job)} ·{" "}
              {formatCents(estimate.totalCents)} · {estimate.status.toLowerCase()}
            </Link>
            {estimate.repairGroups.length ? (
              <RepairGroupEstimate
                estimateId={estimate.id}
                jobId={estimate.jobId}
                groups={estimate.repairGroups}
                canDecide={estimate.status === "SENT"}
                supplemental={estimate.type === "CHANGE_ORDER"}
              />
            ) : (
              <EstimateCard estimate={estimate} canApprove={estimate.status === "SENT"} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
