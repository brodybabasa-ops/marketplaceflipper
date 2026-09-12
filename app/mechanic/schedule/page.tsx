import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/themed-board";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { addDenverDays, formatAppointmentTime, formatDenverDateInput, startOfDenverWeek } from "@/lib/datetime";
import { formatAppointment, formatBoardDate } from "@/lib/utils";

export const metadata = { title: "Scheduler" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function MechanicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { week } = await searchParams;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true },
  });
  const anchor = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? new Date(`${week}T12:00:00.000Z`) : new Date();
  const start = startOfDenverWeek(anchor);
  const end = addDenverDays(start, 7);
  const weekEnd = addDenverDays(start, 6);
  const prev = formatDenverDateInput(addDenverDays(start, -7));
  const next = formatDenverDateInput(addDenverDays(start, 7));

  const [jobs, unscheduled] = await Promise.all([
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: { gte: start, lt: end },
        status: { notIn: ["CANCELLED"] },
      },
      include: { customer: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: null,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      include: { customer: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  const columns = DAYS.map((label, index) => {
    const dayStart = addDenverDays(start, index);
    const dayEnd = addDenverDays(start, index + 1);
    const dayJobs = jobs.filter(
      (job) => job.scheduledAt && job.scheduledAt >= dayStart && job.scheduledAt < dayEnd,
    );
    const availability = profile.availability.find((slot) => {
      const map = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      return slot.dayOfWeek === map[index];
    });
    return { label, date: dayStart, jobs: dayJobs, hours: availability };
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading
          title="Scheduler"
          subtitle={`${formatBoardDate(start)} – ${formatBoardDate(weekEnd)} · the same times customers see`}
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/mechanic/schedule?week=${prev}`}>Previous</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/mechanic/schedule">This week</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/mechanic/schedule?week=${next}`}>Next</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/mechanic/jobs/new">New repair order</Link>
          </Button>
        </div>
      </div>

      {unscheduled.length ? (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold text-navy">Needs a time</h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unscheduled.map((job) => (
              <Link
                key={job.id}
                href={`/mechanic/jobs/${job.id}#appointment`}
                className="rounded-xl border border-line bg-paper p-3 hover:bg-card"
              >
                <p className="font-semibold text-navy">
                  {job.customer.firstName} {job.customer.lastName}
                </p>
                <p className="truncate text-sm text-muted">
                  {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-2 md:grid-cols-7">
        {columns.map((column) => (
          <section key={column.label} className="min-h-[16rem] rounded-xl border border-line bg-paper p-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{column.label}</p>
            <p className="text-sm font-semibold text-navy">{formatDenverDateInput(column.date).slice(5)}</p>
            <p className="mt-1 text-[11px] text-muted">
              {column.hours ? `${column.hours.startTime}–${column.hours.endTime}` : "Closed"}
            </p>
            <div className="mt-2 space-y-2">
              {column.jobs.length === 0 ? (
                <p className="text-[11px] text-muted">Open</p>
              ) : (
                column.jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/mechanic/jobs/${job.id}#appointment`}
                    className="block rounded-lg bg-card p-2 hover:bg-[#071422]"
                  >
                    <p className="text-xs font-bold text-[#7eb0ff]">
                      {job.scheduledAt ? formatAppointmentTime(job.scheduledAt) : "—"}
                    </p>
                    <p className="truncate text-sm font-semibold text-navy">{job.customer.firstName}</p>
                    <p className="truncate text-[11px] text-muted">{job.serviceRequest.problemText}</p>
                    <div className="mt-1">
                      <JobStatusLabel status={job.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Times are America/Denver. {jobs.length} job{jobs.length === 1 ? "" : "s"} on the book this week
        {jobs[0]?.scheduledAt ? ` · next ${formatAppointment(jobs[0].scheduledAt)}` : ""}.
      </p>
    </div>
  );
}
