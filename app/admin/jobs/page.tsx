import { BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Jobs" };

export default async function AdminJobsPage() {
  await requireSession("ADMIN");
  const jobs = await prisma.job.findMany({
    include: { customer: true, mechanicProfile: true, serviceRequest: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <BoardLink key={job.id} href={`/jobs/${job.id}`}>
          <p className="font-semibold text-navy">{job.serviceRequest.problemText}</p>
          <p className="text-sm text-muted">
            {job.customer.firstName} → {job.mechanicProfile.businessName} · {job.status.replaceAll("_", " ").toLowerCase()}
          </p>
        </BoardLink>
      ))}
    </div>
  );
}
