import Link from "next/link";
import { PageHeading } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatBoardDate } from "@/lib/utils";

export const metadata = { title: "Estimates" };

export default async function MechanicEstimatesPage() {
  const session = await requireSession("MECHANIC");
  const estimates = await prisma.estimate.findMany({
    where: { mechanicId: session.id },
    include: {
      job: {
        include: {
          customer: true,
          vehicle: { include: { make: true, model: true } },
          serviceRequest: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return (
    <div>
      <PageHeading title="Estimates" subtitle="Written quotes on live jobs. Approvals show on the customer job." />
      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="font-medium">Work</th>
              <th className="font-medium">Amount</th>
              <th className="font-medium">Status</th>
              <th className="pr-4 font-medium">Sent</th>
            </tr>
          </thead>
          <tbody>
            {estimates.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted" colSpan={5}>
                  Send an estimate from a job and it lands here and on the customer Estimates board.
                </td>
              </tr>
            ) : (
              estimates.map((estimate) => (
                <tr key={estimate.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/mechanic/jobs/${estimate.jobId}`} className="font-semibold text-navy hover:text-[#7eb0ff]">
                      {estimate.job.customer.firstName} {estimate.job.customer.lastName}
                    </Link>
                    <p className="text-xs text-muted">
                      {estimate.job.vehicle.year} {estimate.job.vehicle.make.name} {estimate.job.vehicle.model.name}
                    </p>
                  </td>
                  <td className="max-w-xs truncate">{estimate.job.serviceRequest.problemText}</td>
                  <td className="font-semibold">{formatCents(estimate.totalCents)}</td>
                  <td className="capitalize">{estimate.status.toLowerCase()}</td>
                  <td className="pr-4 text-muted">{formatBoardDate(estimate.sentAt ?? estimate.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
