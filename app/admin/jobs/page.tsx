import Link from "next/link";
import { HqAppNav } from "@/components/layout/app-nav";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export const metadata = { title: "Jobs" };

export default async function AdminJobsPage() {
  await requireSession(staffRoles());
  const jobs = await prisma.job.findMany({
    include: { customer: true, mechanicProfile: true, serviceRequest: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <HqAppNav current="/admin/jobs" />
      <h1 className="text-3xl font-bold text-ink">Jobs</h1>
      <div className="mt-6 space-y-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
            <p className="font-semibold text-ink">{job.serviceRequest.problemText}</p>
            <p className="text-sm text-muted">
              {job.customer.firstName} → {job.mechanicProfile.businessName} · {job.status}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
