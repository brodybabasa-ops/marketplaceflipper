import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-navy">Good morning, {session.firstName}.</h1>
      <p className="mt-1 text-muted">{profile.businessName}</p>
      {profile.profileCompletePct < 100 ? (
        <Card className="mt-4 p-4">
          <p className="font-medium text-navy">Profile {profile.profileCompletePct}% complete</p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/mechanic/onboarding">Continue setup</Link>
          </Button>
        </Card>
      ) : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-muted">Today&apos;s jobs</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{todayJobs}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Pending requests</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{pending.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">This month&apos;s jobs</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{monthJobs}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Average rating</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{profile.averageRating.toFixed(1)}</p>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">Pocket Score</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{Math.round(profile.mechanicScore)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Completed jobs</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{profile.completedJobsCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Unread notices</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{unread}</p>
        </Card>
      </div>
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-navy">Pending requests</h2>
          <Link className="text-sm font-semibold text-accent" href="/mechanic/requests">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {pending.map((job) => (
            <Link key={job.id} href={`/mechanic/jobs/${job.id}`} className="block rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
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
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
