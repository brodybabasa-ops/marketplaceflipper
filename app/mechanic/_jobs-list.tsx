import Link from "next/link";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { EmptyState } from "@/components/ui/card";
import { BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export default async function MechanicJobsList({
  title,
  statuses,
}: {
  title: string;
  href: string;
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
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <div className="mt-4 space-y-3">
        {jobs.length === 0 ? (
          <EmptyState title="Nothing here yet" body="New customer requests will show up in this list." />
        ) : (
          jobs.map((job) => (
            <BoardLink key={job.id} href={`/mechanic/jobs/${job.id}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">
                    {job.customer.firstName} {job.customer.lastName}
                  </p>
                  <p className="text-sm text-muted">
                    {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                  </p>
                </div>
                <JobStatusLabel status={job.status} />
              </div>
            </BoardLink>
          ))
        )}
      </div>
    </div>
  );
}
