import Link from "next/link";
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
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-navy">Jobs</h1>
      <div className="mt-6 space-y-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold text-navy">{job.serviceRequest.problemText}</p>
            <p className="text-sm text-muted">
              {job.customer.firstName} → {job.mechanicProfile.businessName} · {job.status}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
