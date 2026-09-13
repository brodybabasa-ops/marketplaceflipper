import { CommandBoard } from "@/components/scheduler/command-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import {
  addDenverDays,
  addDenverMonths,
  denverMonthGrid,
  formatDenverDateInput,
  formatDenverMonthDay,
  formatDenverMonthLabel,
  formatDenverWeekdayLong,
  startOfDenverDay,
  startOfDenverMonth,
  startOfDenverWeek,
  startOfNextDenverDay,
} from "@/lib/datetime";
import { parseBoardLayout } from "@/lib/board-layout";
import { inProgressStatuses } from "@/lib/scheduler";
import { unreadMessageCount } from "@/services/messages";
import {
  ensureSchedulerResources,
  jobCardInclude,
  partsFromJobs,
  remindersFromBoard,
  toHoldCard,
  toJobCard,
  toResourceCard,
} from "@/services/scheduler";

export const metadata = { title: "Schedule" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

export default async function MechanicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{
    week?: string;
    date?: string;
    moving?: string;
    view?: string;
    panel?: string;
    resource?: string;
    type?: string;
    status?: string;
    mode?: string;
    q?: string;
    customize?: string;
  }>;
}) {
  const session = await requireSession("MECHANIC");
  const params = await searchParams;
  const view = params.view === "week" || params.view === "month" ? params.view : "day";
  const rawDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : params.week;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true, user: true },
  });
  const resources = await ensureSchedulerResources(profile.id);
  const anchor = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(`${rawDate}T12:00:00.000Z`) : new Date();
  const selected = startOfDenverDay(anchor);
  const selectedYmd = formatDenverDateInput(selected);
  const weekStart = startOfDenverWeek(selected);
  const monthStart = startOfDenverMonth(selected);
  const monthGrid = denverMonthGrid(monthStart);
  const dayEnd = startOfNextDenverDay(selected);
  const rangeStart = view === "month" ? monthGrid.gridStart : view === "week" ? weekStart : selected;
  const rangeEnd = view === "month" ? monthGrid.gridEnd : view === "week" ? addDenverDays(weekStart, 7) : dayEnd;
  const prev =
    view === "month"
      ? formatDenverDateInput(addDenverMonths(monthStart, -1))
      : formatDenverDateInput(addDenverDays(selected, view === "week" ? -7 : -1));
  const next =
    view === "month"
      ? formatDenverDateInput(addDenverMonths(monthStart, 1))
      : formatDenverDateInput(addDenverDays(selected, view === "week" ? 7 : 1));
  const todayDate = formatDenverDateInput(new Date());
  const movingId = params.moving && /^[0-9a-f-]{36}$/i.test(params.moving) ? params.moving : undefined;
  const lastWeekDay = addDenverDays(selected, -7);
  const lastWeekEnd = addDenverDays(lastWeekDay, 1);

  const [booked, unscheduledRows, lastWeekCount, unread] = await Promise.all([
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: { gte: rangeStart, lt: rangeEnd },
        status: { notIn: ["CANCELLED"] },
      },
      include: jobCardInclude,
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: null,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      include: jobCardInclude,
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.job.count({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: { gte: lastWeekDay, lt: lastWeekEnd },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    unreadMessageCount(session.id, session.role),
  ]);

  const holds = await prisma.schedulerBlock.findMany({
    where: { mechanicProfileId: profile.id, startAt: { gte: selected, lt: dayEnd } },
    orderBy: { startAt: "asc" },
  });

  const now = new Date();
  const jobCards = booked.map((job) => toJobCard(job, now));
  const unscheduledCards = unscheduledRows.map((job) => toJobCard(job, now));
  const statsSource = jobCards.filter(
    (job) => job.scheduledAt && formatDenverDateInput(new Date(job.scheduledAt)) === selectedYmd,
  );

  const resourceCards = resources.map((resource) => {
    const count = statsSource.filter((job) => job.resourceId === resource.id).length;
    const mobileWork = statsSource.some((job) => job.resourceId === resource.id && job.mobile);
    return toResourceCard(resource, count, mobileWork);
  });

  function hoursForIndex(index: number) {
    const availability = profile.availability.find((slot) => slot.dayOfWeek === WEEKDAY[index]);
    return availability ? `${availability.startTime}–${availability.endTime}` : "Closed";
  }

  const columns =
    view === "month"
      ? monthGrid.days.map((dayStart) => {
          const end = addDenverDays(dayStart, 1);
          const ymd = formatDenverDateInput(dayStart);
          const index = new Date(`${ymd}T12:00:00.000Z`).getUTCDay();
          const dayJobsForCell = booked.filter((job) => job.scheduledAt && job.scheduledAt >= dayStart && job.scheduledAt < end);
          return {
            label: DAYS[index],
            date: ymd,
            hoursLabel: hoursForIndex(index),
            jobIds: dayJobsForCell.map((job) => job.id),
            inMonth: ymd.slice(0, 7) === formatDenverDateInput(monthStart).slice(0, 7),
          };
        })
      : DAYS.map((label, index) => {
          const dayStart = addDenverDays(weekStart, index);
          const end = addDenverDays(weekStart, index + 1);
          const dayJobsForCell = booked.filter((job) => job.scheduledAt && job.scheduledAt >= dayStart && job.scheduledAt < end);
          return {
            label,
            date: formatDenverDateInput(dayStart),
            hoursLabel: hoursForIndex(index),
            jobIds: dayJobsForCell.map((job) => job.id),
            inMonth: true,
          };
        });

  const related = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const ids = related.map((job) => job.customerId);
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      vehicles: { some: { archivedAt: null } },
      OR: [...(ids.length ? [{ id: { in: ids } }] : []), { customerProfile: { zip: profile.shopZip ?? "84041" } }],
    },
    include: { vehicles: { where: { archivedAt: null }, include: { make: true, model: true }, orderBy: { createdAt: "asc" } } },
    take: 40,
  });
  const customers = users
    .filter((user) => user.vehicles.length > 0)
    .map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      vehicles: user.vehicles.map((vehicle) => ({
        id: vehicle.id,
        label: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
      })),
    }));

  const calendarDays = monthGrid.days.map((dayStart) => {
    const ymd = formatDenverDateInput(dayStart);
    const end = addDenverDays(dayStart, 1);
    return {
      date: ymd,
      inMonth: ymd.slice(0, 7) === formatDenverDateInput(monthStart).slice(0, 7),
      count: booked.filter((job) => job.scheduledAt && job.scheduledAt >= dayStart && job.scheduledAt < end).length,
    };
  });

  const appointments = statsSource.length;
  const delta = lastWeekCount === 0 ? (appointments ? 100 : 0) : Math.round(((appointments - lastWeekCount) / lastWeekCount) * 100);
  const awaiting = [...jobCards, ...unscheduledCards].filter((job) => job.status === "AWAITING_APPROVAL");

  return (
    <CommandBoard
      view={view}
      date={selectedYmd}
      dateLabel={
        view === "month"
          ? formatDenverMonthLabel(monthStart)
          : view === "week"
            ? `${formatDenverMonthDay(weekStart)} – ${formatDenverMonthDay(addDenverDays(weekStart, 6))}`
            : formatDenverWeekdayLong(selected)
      }
      prevDate={prev}
      nextDate={next}
      todayDate={todayDate}
      monthLabel={formatDenverMonthLabel(monthStart)}
      shopName={profile.businessName}
      shopCity={profile.shopCity ?? ""}
      shopState={profile.shopState ?? "UT"}
      origin={{ latitude: profile.latitude, longitude: profile.longitude, label: profile.businessName }}
      stats={{
        appointments,
        appointmentsDelta: delta,
        inProgress: statsSource.filter((job) => inProgressStatuses().includes(job.status)).length,
        waitingOnParts: statsSource.filter((job) => job.waitingOnParts).length,
        behind: statsSource.filter((job) => job.behind).length,
        revenueCents: statsSource.reduce((sum, job) => sum + job.estimateCents, 0),
        onTimePct: profile.onTimePercentage,
      }}
      resources={resourceCards}
      jobs={jobCards}
      holds={holds.map(toHoldCard)}
      columns={columns}
      unscheduled={unscheduledCards}
      reminders={remindersFromBoard({ awaiting, unreadCount: unread, behind: statsSource.filter((job) => job.behind) })}
      parts={partsFromJobs(statsSource.length ? statsSource : jobCards)}
      calendarDays={calendarDays}
      movingJobId={movingId}
      panel={params.panel}
      filters={{
        resource: params.resource,
        type: params.type,
        status: params.status,
        mode: params.mode,
        q: params.q,
      }}
      customers={customers}
      layout={parseBoardLayout(profile.schedulerLayout)}
      customize={params.customize === "1"}
    />
  );
}
