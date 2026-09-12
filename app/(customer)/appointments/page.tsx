import type { JobStatus } from "@prisma/client";
import { ThemedBoard, BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatAppointment } from "@/lib/utils";
import { JobStatusLabel } from "@/components/jobs/status-timeline";

export const metadata = { title: "Appointments" };

const OPEN_STATUSES: JobStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "SCHEDULED",
  "EN_ROUTE",
  "ARRIVED",
  "DIAGNOSING",
  "AWAITING_APPROVAL",
  "IN_PROGRESS",
  "DISPUTED",
];

export default async function AppointmentsPage() {
  const session = await requireSession("CUSTOMER");
  const jobs = await prisma.job.findMany({
    where: {
      customerId: session.id,
      status: { notIn: ["CANCELLED"] },
    },
    include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
    orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
  });

  const now = Date.now();
  const upcoming = jobs
    .filter((job) => job.scheduledAt && job.scheduledAt.getTime() >= now && job.status !== "COMPLETED")
    .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime());
  const needsTime = jobs.filter(
    (job) => !job.scheduledAt && OPEN_STATUSES.includes(job.status),
  );
  const past = jobs
    .filter((job) => job.scheduledAt && (job.scheduledAt.getTime() < now || job.status === "COMPLETED"))
    .sort((a, b) => (b.scheduledAt?.getTime() ?? 0) - (a.scheduledAt?.getTime() ?? 0));

  return (
    <ThemedBoard
      eyebrow="APPOINTMENTS"
      title="On the"
      accent="Book."
      subtitle="The same times shops put on the job. Change one here and it updates My Repairs, the shop book, and the calendar file."
      script="Less Time Waiting."
      image="/landing/dashboard-hero.png"
    >
      <Section title="Upcoming" empty="Nothing on the book yet." jobs={upcoming} />
      <Section
        title="Needs a time"
        empty="Every open job has a time."
        jobs={needsTime}
        fallback="Pick a time on the job"
      />
      <Section title="Past" empty="No past appointments." jobs={past} />
    </ThemedBoard>
  );
}

function Section({
  title,
  empty,
  jobs,
  fallback,
}: {
  title: string;
  empty: string;
  fallback?: string;
  jobs: {
    id: string;
    scheduledAt: Date | null;
    status: JobStatus;
    mechanicProfile: { businessName: string };
    vehicle: { year: number; make: { name: string }; model: { name: string } };
    serviceRequest: { problemText: string; preferredTimeWindow: string | null };
  }[];
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-navy">{title}</h2>
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <p className="text-sm text-muted">{empty}</p>
        ) : (
          jobs.map((job) => (
            <BoardLink key={job.id} href={`/jobs/${job.id}#appointment`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{job.mechanicProfile.businessName}</p>
                  <p className="text-sm text-muted">
                    {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                  </p>
                  {job.scheduledAt ? (
                    <p className="mt-1 text-sm font-semibold">{formatAppointment(job.scheduledAt)}</p>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-[#2f7bff]">{fallback ?? "Needs a time"}</p>
                  )}
                </div>
                <JobStatusLabel status={job.status} />
              </div>
            </BoardLink>
          ))
        )}
      </div>
    </section>
  );
}
