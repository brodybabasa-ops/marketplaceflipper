import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { AcceptJobButton } from "@/components/jobs/accept-job-button";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatAppointment } from "@/lib/utils";

export default async function MechanicJobsList({
  statuses,
}: {
  title?: string;
  href?: string;
  statuses?: (
    | "REQUESTED"
    | "ACCEPTED"
    | "SCHEDULED"
    | "EN_ROUTE"
    | "ARRIVED"
    | "DIAGNOSING"
    | "AWAITING_APPROVAL"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "DISPUTED"
  )[];
}) {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id, ...(statuses ? { status: { in: statuses } } : {}) },
    include: { customer: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      {!statuses ? (
        <div className="mb-4 flex justify-end">
          <Button asChild size="sm">
            <Link href="/mechanic/jobs/new">New repair order</Link>
          </Button>
        </div>
      ) : null}
      {jobs.length === 0 ? (
        <EmptyState title="Nothing here yet" body="New customer requests will show up in this list." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="font-medium">Machine</th>
                <th className="font-medium">Work</th>
                <th className="font-medium">When</th>
                <th className="font-medium">Status</th>
                <th className="pr-4 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/mechanic/jobs/${job.id}`} className="font-semibold text-navy hover:text-[#7eb0ff]">
                      {job.customer.firstName} {job.customer.lastName}
                    </Link>
                  </td>
                  <td>
                    {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                  </td>
                  <td className="max-w-xs truncate">{job.serviceRequest.problemText}</td>
                  <td>
                    <Link href={`/mechanic/jobs/${job.id}#appointment`} className="text-navy">
                      {job.scheduledAt ? formatAppointment(job.scheduledAt) : "Set time"}
                    </Link>
                  </td>
                  <td>
                    <JobStatusLabel status={job.status} />
                  </td>
                  <td className="pr-4">
                    {job.status === "REQUESTED" ? <AcceptJobButton jobId={job.id} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
