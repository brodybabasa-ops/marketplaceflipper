import { EmptyState } from "@/components/ui/card";
import { ThemedBoard, BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatAppointment } from "@/lib/utils";
import { JobStatusLabel } from "@/components/jobs/status-timeline";

export const metadata = { title: "Appointments" };

export default async function AppointmentsPage() {
  const session = await requireSession("CUSTOMER");
  const jobs = await prisma.job.findMany({
    where: {
      customerId: session.id,
      scheduledAt: { not: null },
      status: { notIn: ["CANCELLED"] },
    },
    include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
    orderBy: { scheduledAt: "desc" },
  });
  return (
    <ThemedBoard
      eyebrow="APPOINTMENTS"
      title="On the"
      accent="Book."
      subtitle="Times shops have on the job record. Message the shop if you need to change one."
      script="Less Time Waiting."
      image="/landing/dashboard-hero.png"
    >
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <EmptyState title="No appointments yet" body="Book a shop from Find a Shop or a vehicle card." />
        ) : (
          jobs.map((job) => (
            <BoardLink key={job.id} href={`/jobs/${job.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{job.mechanicProfile.businessName}</p>
                  <p className="text-sm text-muted">
                    {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                  </p>
                  {job.scheduledAt ? <p className="mt-1 text-sm font-semibold">{formatAppointment(job.scheduledAt)}</p> : null}
                </div>
                <JobStatusLabel status={job.status} />
              </div>
            </BoardLink>
          ))
        )}
      </div>
    </ThemedBoard>
  );
}
