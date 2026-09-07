import Link from "next/link";
import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

export const metadata = { title: "My jobs" };

export default async function JobsPage() {
  const session = await requireSession("CUSTOMER");
  const jobs = await prisma.job.findMany({
    where: { customerId: session.id },
    include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AppNav items={CUSTOMER_NAV} current="/jobs" />
      <h1 className="text-3xl font-bold text-navy">My jobs</h1>
      <div className="mt-6 space-y-3">
        {jobs.length === 0 ? (
          <EmptyState title="No jobs yet" body="Request service from a mechanic to start tracking the work." />
        ) : (
          jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{job.mechanicProfile.businessName}</p>
                  <p className="text-sm text-muted">
                    {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                  </p>
                  {job.status === "COMPLETED" && job.paymentStatus !== "PAID" && job.totalCents > 0 ? (
                    <p className="mt-1 text-sm font-semibold text-accent">Pay {formatCents(job.totalCents)}</p>
                  ) : null}
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
