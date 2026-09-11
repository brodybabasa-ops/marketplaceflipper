import Link from "next/link";
import { EmptyState } from "@/components/ui/card";
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
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-navy">Estimates</h1>
      <p className="mt-2 text-sm text-muted">Written estimates from shops on your jobs. Extra work still needs your approval.</p>
      <div className="mt-6 space-y-3">
        {estimates.length === 0 ? (
          <EmptyState title="No estimates yet" body="Request service and a shop will send a written estimate before extra work starts." />
        ) : (
          estimates.map((estimate) => (
            <Link key={estimate.id} href={`/jobs/${estimate.jobId}`} className="block rounded-2xl border border-line bg-white p-4">
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
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
