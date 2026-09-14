import { BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatAppointment } from "@/lib/utils";
import { jobSearchWhere } from "@/services/jobs";

export const metadata = { title: "Jobs" };

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireSession("ADMIN");
  const { q } = await searchParams;
  const jobs = await prisma.job.findMany({
    where: jobSearchWhere(q),
    include: {
      customer: true,
      mechanicProfile: true,
      serviceRequest: true,
      vehicle: { include: { make: true, model: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return (
    <div className="space-y-3">
      {q ? <p className="text-sm text-muted">Showing matches for “{q}”.</p> : null}
      {jobs.length === 0 ? (
        <p className="text-sm text-muted">{q ? "No jobs matched that search." : "No jobs yet."}</p>
      ) : (
        jobs.map((job) => (
          <BoardLink key={job.id} href={`/admin/jobs/${job.id}`}>
            <p className="font-semibold text-navy">{job.serviceRequest.problemText}</p>
            <p className="text-sm text-muted">
              {job.customer.firstName} {job.customer.lastName} → {job.mechanicProfile.businessName} ·{" "}
              {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.status.replaceAll("_", " ").toLowerCase()}
              {job.scheduledAt ? ` · ${formatAppointment(job.scheduledAt)}` : ""}
            </p>
          </BoardLink>
        ))
      )}
    </div>
  );
}
