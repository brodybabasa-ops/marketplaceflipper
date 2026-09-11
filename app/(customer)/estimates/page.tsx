import { EmptyState } from "@/components/ui/card";
import { ThemedBoard, BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

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
          estimates.map((estimate) => (
            <BoardLink key={estimate.id} href={`/jobs/${estimate.jobId}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{estimate.job.mechanicProfile.businessName}</p>
                  <p className="text-sm text-muted">
                    {estimate.job.vehicle.year} {estimate.job.vehicle.make.name} {estimate.job.vehicle.model.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCents(estimate.totalCents)}</p>
                  <p className="text-xs capitalize text-muted">{estimate.status.toLowerCase()}</p>
                </div>
              </div>
            </BoardLink>
          ))
        )}
      </div>
    </ThemedBoard>
  );
}
