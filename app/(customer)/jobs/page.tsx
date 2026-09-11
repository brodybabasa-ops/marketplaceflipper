import Link from "next/link";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { vehiclePhotoFor } from "@/lib/landing";

export const metadata = { title: "My jobs" };

export default async function JobsPage() {
  const session = await requireSession("CUSTOMER");
  const jobs = await prisma.job.findMany({
    where: { customerId: session.id },
    include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-navy">My repairs</h1>
      <div className="mt-6 space-y-3">
        {jobs.length === 0 ? (
          <EmptyState title="No jobs yet" body="Request service from a mechanic to start tracking the work." />
        ) : (
          jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name)}
                alt=""
                className="h-16 w-20 rounded-xl object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{job.mechanicProfile.businessName}</p>
                  <p className="text-sm text-muted">
                    {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                  </p>
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
