import Link from "next/link";
import { EmptyState } from "@/components/ui/card";
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
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-navy">Appointments</h1>
      <p className="mt-2 text-sm text-muted">Times shops have on the job record. Message the shop from the job if you need to change one.</p>
      <div className="mt-6 space-y-3">
        {jobs.length === 0 ? (
          <EmptyState title="No appointments yet" body="Book a shop from Find a Shop or a vehicle card." />
        ) : (
          jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-white p-4">
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
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
