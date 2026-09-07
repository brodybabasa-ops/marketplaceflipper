import Link from "next/link";
import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { Badge, Card, KpiCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { formatCents } from "@/lib/money";
import { jobAssetLabel } from "@/lib/asset-display";
import { applyVerificationAction } from "@/app/actions/master";

export const metadata = { title: "Mechanic dashboard" };

export default async function MechanicDashboardPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUnique({ where: { userId: session.id } });
  if (!profile) return null;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const [todayJobs, requests, awaiting, ready, monthRevenue, workflow] = await Promise.all([
    prisma.job.count({ where: { mechanicProfileId: profile.id, scheduledAt: { gte: startOfDay }, status: { notIn: ["CANCELLED", "COMPLETED"] } } }),
    prisma.job.count({ where: { mechanicProfileId: profile.id, status: "REQUESTED" } }),
    prisma.job.count({ where: { mechanicProfileId: profile.id, status: "AWAITING_APPROVAL" } }),
    prisma.job.count({ where: { mechanicProfileId: profile.id, status: "READY" } }),
    prisma.job.aggregate({
      where: { mechanicProfileId: profile.id, status: "COMPLETED", completedAt: { gte: startOfMonth } },
      _sum: { totalCents: true },
    }),
    prisma.job.findMany({
      where: { mechanicProfileId: profile.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: { customer: true, vehicle: { include: { make: true, model: true } }, asset: true, serviceRequest: true },
      orderBy: { scheduledAt: "asc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <AppNav items={MECHANIC_NAV} current="/mechanic" />
      <h1 className="text-3xl font-bold text-ink">Good morning, {session.firstName}.</h1>
      <p className="mt-1 text-muted">
        {profile.businessName}
        {profile.isFoundingProvider ? ` · Founding Mechanic #${String(profile.foundingNumber).padStart(3, "0")}` : ""}
      </p>
      {profile.verificationPipeline === "NOT_STARTED" || profile.verificationLevel === "UNVERIFIED" ? (
        <Card className="mt-4 p-4">
          <p className="font-medium text-ink">Become Pocket Mechanic Verified</p>
          <p className="mt-1 text-sm text-muted">Apply for an in-person Pocket Mechanic evaluation. Verification cannot be purchased.</p>
          <form action={applyVerificationAction} className="mt-3">
            <input type="hidden" name="kind" value={profile.serviceMode === "SHOP" ? "SHOP" : "MOBILE"} />
            <Button size="sm">Apply for verification</Button>
          </form>
        </Card>
      ) : (
        <p className="mt-3 text-sm text-muted">Verification: {profile.verificationPipeline.replaceAll("_", " ").toLowerCase()}</p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="New requests" value={requests} />
        <KpiCard label="Estimate awaiting" value={awaiting} />
        <KpiCard label="Vehicle ready" value={ready} />
        <KpiCard label="This month" value={formatCents(monthRevenue._sum.totalCents ?? 0)} />
      </div>
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Today’s workflow</h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/mechanic/board">Job board</Link>
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {workflow.map((job) => (
            <Link key={job.id} href={`/mechanic/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {jobAssetLabel(job)}
                  </p>
                  <p className="text-sm text-muted">
                    {job.customer.firstName} {job.customer.lastName} · {job.serviceRequest.problemText}
                  </p>
                </div>
                <div className="text-right">
                  <JobStatusLabel status={job.status} />
                  <p className="mt-1 text-xs text-muted">{job.scheduledAt ? job.scheduledAt.toLocaleString() : "Unscheduled"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">{todayJobs} on the calendar today</p>
      </section>
    </div>
  );
}
