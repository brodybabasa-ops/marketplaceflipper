import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { AcceptJobButton } from "@/components/jobs/accept-job-button";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { startOfDenverDay, startOfDenverMonth, startOfNextDenverDay } from "@/lib/datetime";
import { formatAppointment } from "@/lib/utils";

export const metadata = { title: "Shop command" };

const jobInclude = {
  customer: true,
  vehicle: { include: { make: true, model: true } },
  serviceRequest: true,
} as const;

export default async function MechanicDashboardPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUnique({ where: { userId: session.id } });
  if (!profile) return null;
  const startOfDay = startOfDenverDay();
  const endOfDay = startOfNextDenverDay();
  const startOfMonth = startOfDenverMonth();

  const [incoming, inBay, waiting, today, monthJobs, unscheduled] = await Promise.all([
    prisma.job.findMany({
      where: { mechanicProfileId: profile.id, status: "REQUESTED" },
      include: jobInclude,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        status: { in: ["ACCEPTED", "SCHEDULED", "EN_ROUTE", "ARRIVED", "DIAGNOSING", "IN_PROGRESS"] },
      },
      include: jobInclude,
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    prisma.job.findMany({
      where: { mechanicProfileId: profile.id, status: "AWAITING_APPROVAL" },
      include: jobInclude,
      take: 4,
    }),
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: { gte: startOfDay, lt: endOfDay },
        status: { notIn: ["CANCELLED"] },
      },
      include: jobInclude,
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.job.count({
      where: {
        mechanicProfileId: profile.id,
        OR: [{ createdAt: { gte: startOfMonth } }, { scheduledAt: { gte: startOfMonth } }],
      },
    }),
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: null,
        status: { in: ["ACCEPTED", "SCHEDULED", "DIAGNOSING", "IN_PROGRESS", "AWAITING_APPROVAL"] },
      },
      include: jobInclude,
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div>
      {profile.profileCompletePct < 100 ? (
        <Card className="border-0 p-4">
          <p className="font-medium text-navy">Profile {profile.profileCompletePct}% complete</p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/mechanic/onboarding">Continue setup</Link>
          </Button>
        </Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="On the book today" value={today.length} />
        <StatCard label="Incoming requests" value={incoming.length} />
        <StatCard label="In the bay" value={inBay.length} />
        <StatCard label="This month" value={monthJobs} />
      </div>
      <div className="mt-5 grid items-start gap-4 xl:grid-cols-2">
        <Queue
          title="Incoming"
          href="/mechanic/requests"
          empty="No new requests."
          jobs={incoming}
        />
        <Queue
          title="In the bay"
          href="/mechanic/jobs"
          empty="Nothing in service."
          jobs={inBay}
        />
      </div>
      {waiting.length ? (
        <div className="mt-4">
          <Queue title="Waiting on customer" href="/mechanic/jobs" empty="" jobs={waiting} />
        </div>
      ) : null}
      {unscheduled.length ? (
        <div className="mt-4">
          <Queue title="Needs a time" href="/mechanic/jobs" empty="" jobs={unscheduled} />
        </div>
      ) : null}
      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Today&apos;s book</h2>
          <Link className="text-sm font-semibold text-[#7eb0ff]" href="/mechanic/jobs">
            All jobs →
          </Link>
        </div>
        {today.length === 0 ? (
          <p className="text-sm text-muted">Nothing scheduled for today.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-paper">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="font-medium">Customer</th>
                  <th className="font-medium">Machine</th>
                  <th className="font-medium">Work</th>
                  <th className="pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {today.map((job) => (
                  <tr key={job.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold text-navy">
                      {job.scheduledAt ? formatAppointment(job.scheduledAt) : "Unscheduled"}
                    </td>
                    <td>
                      {job.customer.firstName} {job.customer.lastName}
                    </td>
                    <td>
                      {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                    </td>
                    <td className="max-w-xs truncate">{job.serviceRequest.problemText}</td>
                    <td className="pr-4">
                      <Link href={`/mechanic/jobs/${job.id}#appointment`} className="inline-flex">
                        <JobStatusLabel status={job.status} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Queue({
  title,
  href,
  empty,
  jobs,
}: {
  title: string;
  href: string;
  empty: string;
  jobs: {
    id: string;
    status: Parameters<typeof JobStatusLabel>[0]["status"];
    scheduledAt?: Date | null;
    customer: { firstName: string; lastName: string };
    vehicle: { year: number; make: { name: string }; model: { name: string } };
    serviceRequest: { problemText: string };
  }[];
}) {
  return (
    <section className="rounded-xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">{title}</h2>
        <Link className="text-sm font-semibold text-[#7eb0ff]" href={href}>
          View all →
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {jobs.length === 0 ? (
          <p className="py-6 text-sm text-muted">{empty}</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-3 hover:bg-[#071422]"
            >
              <Link href={`/mechanic/jobs/${job.id}#appointment`} className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">
                  {job.customer.firstName} {job.customer.lastName}
                </p>
                <p className="truncate text-sm text-muted">
                  {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                </p>
                {job.scheduledAt ? (
                  <p className="text-xs font-semibold text-[#7eb0ff]">{formatAppointment(job.scheduledAt)}</p>
                ) : null}
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <JobStatusLabel status={job.status} />
                {job.status === "REQUESTED" ? <AcceptJobButton jobId={job.id} /> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
