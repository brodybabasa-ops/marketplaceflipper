import Link from "next/link";
import { EmptyState } from "@/components/ui/card";
import { ThemedBoard, BoardLink, BoardRow } from "@/components/layout/themed-board";
import { EstimateDecisionButtons } from "@/components/jobs/estimate-card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { estimateStatusClass, estimateStatusLabel, isSentEstimate } from "@/lib/estimates";

export const metadata = { title: "Estimates" };

export default async function EstimatesPage() {
  const session = await requireSession("CUSTOMER");
  const estimates = await prisma.estimate.findMany({
    where: { job: { customerId: session.id }, status: { in: ["SENT", "APPROVED", "DECLINED"] } },
    include: {
      job: {
        include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <ThemedBoard
      eyebrow="ESTIMATES"
      title="Written"
      accent="Estimates."
      subtitle="See what a shop quoted before extra work starts."
      script="No surprises. Just the work."
      image="/landing/shop-diesel.png"
    >
      <div className="space-y-3">
        {estimates.length === 0 ? (
          <EmptyState title="No estimates yet" body="Request service and a shop will send a written estimate before extra work starts." />
        ) : (
          estimates.map((estimate) => {
            const pending = isSentEstimate(estimate.status);
            const body = (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{estimate.job.mechanicProfile.businessName}</p>
                  <p className="text-sm text-muted">
                    {estimate.job.vehicle.year} {estimate.job.vehicle.make.name} {estimate.job.vehicle.model.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCents(estimate.totalCents)}</p>
                  <p className={`text-xs font-semibold ${estimateStatusClass(estimate.status)}`}>
                    {estimateStatusLabel(estimate.status)}
                  </p>
                </div>
              </div>
            );
            if (pending) {
              return (
                <BoardRow key={estimate.id}>
                  {body}
                  <EstimateDecisionButtons estimateId={estimate.id} returnTo="/estimates" />
                  <Link href={`/jobs/${estimate.jobId}#estimate`} className="mt-3 inline-block text-sm font-semibold text-[#2f7bff]">
                    View details
                  </Link>
                </BoardRow>
              );
            }
            return (
              <BoardLink key={estimate.id} href={`/jobs/${estimate.jobId}#estimate`}>
                {body}
              </BoardLink>
            );
          })
        )}
      </div>
    </ThemedBoard>
  );
}
