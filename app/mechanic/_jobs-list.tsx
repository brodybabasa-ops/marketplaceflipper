import Link from "next/link";
import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { jobAssetLabel } from "@/lib/asset-display";

export default async function MechanicJobsList({ title, href, statuses }: { title: string; href: string; statuses?: ("REQUESTED" | "ACCEPTED" | "SCHEDULED" | "EN_ROUTE" | "ARRIVED" | "DIAGNOSING" | "AWAITING_APPROVAL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED")[] }) {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id, ...(statuses ? { status: { in: statuses } } : {}) },
    include: { customer: true, vehicle: { include: { make: true, model: true } }, asset: true, serviceRequest: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AppNav items={MECHANIC_NAV} current={href} />
      <h1 className="text-3xl font-bold text-ink">{title}</h1>
      <div className="mt-6 space-y-3">
        {jobs.length === 0 ? (
          <EmptyState title="Nothing here yet" body="New customer requests will show up in this list." />
        ) : (
          jobs.map((job) => (
            <Link key={job.id} href={`/mechanic/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {job.customer.firstName} {job.customer.lastName}
                  </p>
                  <p className="text-sm text-muted">
                    {jobAssetLabel(job)} · {job.serviceRequest.problemText}
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
