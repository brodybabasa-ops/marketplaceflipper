import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/themed-board";
import { WeekScheduler, type SchedulerJob } from "@/components/jobs/week-scheduler";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import {
  addDenverDays,
  addDenverMonths,
  denverMonthGrid,
  formatAppointmentTime,
  formatDenverDateInput,
  formatDenverMonthLabel,
  formatDenverTimeInput,
  mechanicScheduleHref,
  startOfDenverMonth,
  startOfDenverWeek,
} from "@/lib/datetime";
import { formatAppointment, formatBoardDate, cn } from "@/lib/utils";

export const metadata = { title: "Scheduler" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

export default async function MechanicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; moving?: string; view?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { week, moving, view: viewParam } = await searchParams;
  const view = viewParam === "month" ? "month" : "week";
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true },
  });
  const anchor = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? new Date(`${week}T12:00:00.000Z`) : new Date();

  const weekStart = startOfDenverWeek(anchor);
  const monthStart = startOfDenverMonth(anchor);
  const monthGrid = denverMonthGrid(monthStart);
  const rangeStart = view === "month" ? monthGrid.gridStart : weekStart;
  const rangeEnd = view === "month" ? monthGrid.gridEnd : addDenverDays(weekStart, 7);
  const prev = formatDenverDateInput(view === "month" ? addDenverMonths(monthStart, -1) : addDenverDays(weekStart, -7));
  const next = formatDenverDateInput(view === "month" ? addDenverMonths(monthStart, 1) : addDenverDays(weekStart, 7));
  const currentAnchor = formatDenverDateInput(view === "month" ? monthStart : weekStart);
  const movingId = moving && jobsReady(moving) ? moving : undefined;

  const [booked, unscheduledRows] = await Promise.all([
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: { gte: rangeStart, lt: rangeEnd },
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

  function toCard(job: (typeof booked)[number], bookedSlot: boolean): SchedulerJob {
    return {
      id: job.id,
      href: `/mechanic/jobs/${job.id}#appointment`,
      customerName: bookedSlot ? job.customer.firstName : `${job.customer.firstName} ${job.customer.lastName}`,
      problem: job.serviceRequest.problemText,
      vehicleLabel: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`,
      status: job.status,
      time: job.scheduledAt ? formatDenverTimeInput(job.scheduledAt) : "09:00",
      timeLabel: job.scheduledAt ? formatAppointmentTime(job.scheduledAt) : null,
    };
  }

  const jobs: Record<string, SchedulerJob> = {};
  for (const job of booked) jobs[job.id] = toCard(job, true);
  const unscheduledCards = unscheduledRows.map((job) => toCard(job, false));
  for (const job of unscheduledCards) jobs[job.id] = job;

  function hoursForIndex(index: number) {
    const availability = profile.availability.find((slot) => slot.dayOfWeek === WEEKDAY[index]);
    return availability ? `${availability.startTime}–${availability.endTime}` : "Closed";
  }

  const columns =
    view === "month"
      ? monthGrid.days.map((dayStart) => {
          const dayEnd = addDenverDays(dayStart, 1);
          const ymd = formatDenverDateInput(dayStart);
          const index = new Date(`${ymd}T12:00:00.000Z`).getUTCDay();
          const dayJobs = booked.filter((job) => job.scheduledAt && job.scheduledAt >= dayStart && job.scheduledAt < dayEnd);
          return {
            label: DAYS[index],
            date: ymd,
            hoursLabel: hoursForIndex(index),
            jobIds: dayJobs.map((job) => job.id),
            inMonth: ymd.slice(0, 7) === formatDenverDateInput(monthStart).slice(0, 7),
          };
        })
      : DAYS.map((label, index) => {
          const dayStart = addDenverDays(weekStart, index);
          const dayEnd = addDenverDays(weekStart, index + 1);
          const dayJobs = booked.filter(
            (job) => job.scheduledAt && job.scheduledAt >= dayStart && job.scheduledAt < dayEnd,
          );
          return {
            label,
            date: formatDenverDateInput(dayStart),
            hoursLabel: hoursForIndex(index),
            jobIds: dayJobs.map((job) => job.id),
            inMonth: true,
          };
        });

  const subtitle =
    view === "month"
      ? `${formatDenverMonthLabel(monthStart)} · park a job on any day`
      : `${formatBoardDate(weekStart)} – ${formatBoardDate(addDenverDays(weekStart, 6))} · drag a job onto a day`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title="Scheduler" subtitle={subtitle} />
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-full border border-line bg-card p-1">
            <Link
              href={mechanicScheduleHref({ view: "week", week: formatDenverDateInput(weekStart), moving: movingId })}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3.5 text-sm font-semibold",
                view === "week" ? "bg-[#2f7bff] text-white" : "text-navy hover:bg-paper",
              )}
            >
              Week
            </Link>
            <Link
              href={mechanicScheduleHref({ view: "month", week: formatDenverDateInput(monthStart), moving: movingId })}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3.5 text-sm font-semibold",
                view === "month" ? "bg-[#2f7bff] text-white" : "text-navy hover:bg-paper",
              )}
            >
              Month
            </Link>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={mechanicScheduleHref({ view, week: prev })}>Previous</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link
              href={mechanicScheduleHref({
                view,
                week: formatDenverDateInput(view === "month" ? startOfDenverMonth() : startOfDenverWeek()),
              })}
            >
              {view === "month" ? "This month" : "This week"}
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={mechanicScheduleHref({ view, week: next })}>Next</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/mechanic/jobs/new">New repair order</Link>
          </Button>
        </div>
      </div>

      <WeekScheduler
        jobs={jobs}
        columns={columns}
        unscheduled={unscheduledCards}
        week={currentAnchor}
        view={view}
        movingJobId={movingId && jobs[movingId] ? movingId : undefined}
      />
      <p className="mt-4 text-xs text-muted">
        Times are America/Denver. Drop a job on a day to set or move it. Existing times stay; unscheduled jobs land at
        9:00 AM.
        {booked.length ? ` ${booked.length} job${booked.length === 1 ? "" : "s"} on the book this ${view}` : ""}
        {booked[0]?.scheduledAt ? ` · next ${formatAppointment(booked[0].scheduledAt)}` : ""}.
      </p>
    </div>
  );
}

function jobsReady(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}
