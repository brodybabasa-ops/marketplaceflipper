import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard, BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { JobStatusLabel } from "@/components/jobs/status-timeline";

export const metadata = { title: "Mechanic dashboard" };

export default async function MechanicDashboardPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUnique({ where: { userId: session.id } });
  if (!profile) return null;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const [todayJobs, pending, monthJobs, unread] = await Promise.all([
    prisma.job.count({ where: { mechanicProfileId: profile.id, scheduledAt: { gte: startOfDay }, status: { notIn: ["CANCELLED", "COMPLETED"] } } }),
    prisma.job.findMany({
      where: { mechanicProfileId: profile.id, status: "REQUESTED" },
      include: { customer: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
      take: 5,
    }),
    prisma.job.count({ where: { mechanicProfileId: profile.id, createdAt: { gte: startOfMonth } } }),
    prisma.notification.count({ where: { userId: session.id, readAt: null } }),
  ]);

  return (
    <div>
      <p className="text-muted">{profile.businessName}</p>
      {profile.profileCompletePct < 100 ? (
        <Card className="mt-4 border-0 bg-[#f7f9fc] p-4 shadow-none">
          <p className="font-medium text-navy">Profile {profile.profileCompletePct}% complete</p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/mechanic/onboarding">Continue setup</Link>
          </Button>
        </Card>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's jobs" value={todayJobs} />
        <StatCard label="Pending requests" value={pending.length} />
        <StatCard label="This month's jobs" value={monthJobs} />
        <StatCard label="Average rating" value={profile.averageRating.toFixed(1)} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <StatCard label="Pocket Score" value={Math.round(profile.mechanicScore)} />
        <StatCard label="Completed jobs" value={profile.completedJobsCount} />
        <StatCard label="Unread notices" value={unread} />
      </div>
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Pending requests</h2>
          <Link className="text-sm font-semibold text-[#2f7bff]" href="/mechanic/requests">
            View all →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted">No pending requests right now.</p>
          ) : (
            pending.map((job) => (
              <BoardLink key={job.id} href={`/mechanic/jobs/${job.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">
                      {job.customer.firstName} {job.customer.lastName}
                    </p>
                    <p className="text-sm text-muted">
                      {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                    </p>
                  </div>
                  <JobStatusLabel status={job.status} />
                </div>
              </BoardLink>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
