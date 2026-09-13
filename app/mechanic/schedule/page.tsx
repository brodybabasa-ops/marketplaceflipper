import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/themed-board";
import { WeekScheduler, type SchedulerJob } from "@/components/jobs/week-scheduler";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { addDenverDays, formatAppointmentTime, formatDenverDateInput, formatDenverTimeInput, startOfDenverWeek } from "@/lib/datetime";
import { formatAppointment, formatBoardDate } from "@/lib/utils";

export const metadata = { title: "Scheduler" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function MechanicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; moving?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { week, moving } = await searchParams;
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

  const [booked, unscheduledRows] = await Promise.all([
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

  const columns = DAYS.map((label, index) => {
    const dayStart = addDenverDays(start, index);
    const dayEnd = addDenverDays(start, index + 1);
    const dayJobs = booked.filter(
      (job) => job.scheduledAt && job.scheduledAt >= dayStart && job.scheduledAt < dayEnd,
    );
    const availability = profile.availability.find((slot) => {
      const map = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      return slot.dayOfWeek === map[index];
    });
    return {
      label,
      date: formatDenverDateInput(dayStart),
      hoursLabel: availability ? `${availability.startTime}–${availability.endTime}` : "Closed",
      jobIds: dayJobs.map((job) => job.id),
    };
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading
          title="Scheduler"
          subtitle={`${formatBoardDate(start)} – ${formatBoardDate(weekEnd)} · drag a job onto a day`}
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

      <WeekScheduler
        jobs={jobs}
        columns={columns}
        unscheduled={unscheduledCards}
        week={formatDenverDateInput(start)}
        movingJobId={moving && jobs[moving] ? moving : undefined}
      />
      <p className="mt-4 text-xs text-muted">
        Times are America/Denver. Drop a job on a day to set or move it. Existing times stay; unscheduled jobs land at 9:00 AM.
        {booked.length ? ` ${booked.length} job${booked.length === 1 ? "" : "s"} on the book this week` : ""}
        {booked[0]?.scheduledAt ? ` · next ${formatAppointment(booked[0].scheduledAt)}` : ""}.
      </p>
    </div>
  );
}
