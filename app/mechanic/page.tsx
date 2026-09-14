import { ShopDashboard } from "@/components/shop-os/dashboard-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { addDenverDays, formatDenverDateInput, startOfDenverDay, startOfDenverMonth, startOfNextDenverDay } from "@/lib/datetime";
import { jobWaitingOnParts } from "@/lib/estimates";
import { percentDelta } from "@/lib/shop-os";
import { unreadMessageCount } from "@/services/messages";
import { ensureSchedulerResources, jobCardInclude, toHoldCard, toJobCard, toResourceCard } from "@/services/scheduler";

export const metadata = { title: "Dashboard" };

export default async function MechanicDashboardPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUnique({ where: { userId: session.id } });
  if (!profile) return null;
  const startOfDay = startOfDenverDay();
  const endOfDay = startOfNextDenverDay();
  const startOfMonth = startOfDenverMonth();
  const yesterdayStart = addDenverDays(startOfDay, -1);
  const resources = await ensureSchedulerResources(profile.id);

  const [
    activeRepairs,
    yesterdayActive,
    pendingEstimates,
    completedMonth,
    completedYesterday,
    paidToday,
    paidYesterday,
    billedMonth,
    overdue,
    partsJobs,
    unread,
    disputes,
    todayRows,
    holds,
    recentEvents,
    recentEstimates,
  ] = await Promise.all([
    prisma.job.count({
      where: {
        mechanicProfileId: profile.id,
        status: { in: ["ACCEPTED", "SCHEDULED", "EN_ROUTE", "ARRIVED", "DIAGNOSING", "IN_PROGRESS", "AWAITING_APPROVAL"] },
      },
    }),
    prisma.job.count({
      where: {
        mechanicProfileId: profile.id,
        status: { in: ["ACCEPTED", "SCHEDULED", "EN_ROUTE", "ARRIVED", "DIAGNOSING", "IN_PROGRESS", "AWAITING_APPROVAL"] },
        createdAt: { lt: startOfDay },
      },
    }),
    prisma.estimate.findMany({
      where: { mechanicId: session.id, status: "SENT" },
      select: { totalCents: true },
    }),
    prisma.job.count({
      where: { mechanicProfileId: profile.id, status: "COMPLETED", completedAt: { gte: startOfMonth } },
    }),
    prisma.job.count({
      where: { mechanicProfileId: profile.id, status: "COMPLETED", completedAt: { gte: yesterdayStart, lt: startOfDay } },
    }),
    prisma.job.aggregate({
      where: { mechanicProfileId: profile.id, paymentStatus: "PAID", updatedAt: { gte: startOfDay, lt: endOfDay } },
      _sum: { totalCents: true },
    }),
    prisma.job.aggregate({
      where: { mechanicProfileId: profile.id, paymentStatus: "PAID", updatedAt: { gte: yesterdayStart, lt: startOfDay } },
      _sum: { totalCents: true },
    }),
    prisma.job.findMany({
      where: { mechanicProfileId: profile.id, status: "COMPLETED", completedAt: { gte: startOfMonth } },
      select: { durationMinutes: true, repairRecord: { select: { laborHours: true } } },
    }),
    prisma.job.count({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: { lt: startOfDay },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        status: { in: ["ACCEPTED", "SCHEDULED", "DIAGNOSING", "IN_PROGRESS"] },
      },
      include: { estimates: { include: { lineItems: true }, orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    unreadMessageCount(session.id, session.role),
    prisma.job.count({ where: { mechanicProfileId: profile.id, status: "DISPUTED" } }),
    prisma.job.findMany({
      where: {
        mechanicProfileId: profile.id,
        scheduledAt: { gte: startOfDay, lt: endOfDay },
        status: { notIn: ["CANCELLED"] },
      },
      include: jobCardInclude,
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.schedulerBlock.findMany({
      where: { mechanicProfileId: profile.id, startAt: { gte: startOfDay, lt: endOfDay } },
      orderBy: { startAt: "asc" },
    }),
    prisma.jobEvent.findMany({
      where: { job: { mechanicProfileId: profile.id } },
      include: { job: { include: { customer: true, serviceRequest: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.estimate.findMany({
      where: { mechanicId: session.id },
      include: { job: { include: { customer: true, serviceRequest: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const waitingParts = partsJobs.filter((job) => jobWaitingOnParts(job.status, job.estimates[0]?.lineItems)).length;
  const billedHours = billedMonth.reduce((sum, job) => sum + (job.repairRecord?.laborHours ?? job.durationMinutes / 60), 0);
  const todayCards = todayRows.map((job) => toJobCard(job, new Date()));
  const resourceCards = resources.map((resource) => {
    const count = todayCards.filter((job) => job.resourceId === resource.id).length;
    return toResourceCard(resource, count, false);
  });

  const activeList = await prisma.job.findMany({
    where: {
      mechanicProfileId: profile.id,
      status: { in: ["ACCEPTED", "SCHEDULED", "EN_ROUTE", "ARRIVED", "DIAGNOSING", "IN_PROGRESS", "AWAITING_APPROVAL"] },
    },
    include: { customer: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true, resource: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const activity = [
    ...recentEvents.map((event) => ({
      id: event.id,
      title: event.status.replaceAll("_", " "),
      detail: `${event.job.customer.firstName} ${event.job.customer.lastName} · ${event.job.serviceRequest.problemText}`,
      href: `/mechanic/jobs?job=${event.jobId}`,
      at: event.createdAt,
    })),
    ...recentEstimates.map((estimate) => ({
      id: estimate.id,
      title: `Estimate ${estimate.status.toLowerCase()}`,
      detail: `${estimate.job.customer.firstName} ${estimate.job.customer.lastName} · ${estimate.job.serviceRequest.problemText}`,
      href: `/mechanic/estimates?id=${estimate.id}`,
      at: estimate.createdAt,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return (
    <ShopDashboard
      firstName={session.firstName}
      kpis={{
        activeRepairs,
        activeDelta: percentDelta(activeRepairs, yesterdayActive),
        estimatesPending: pendingEstimates.length,
        estimatesValue: pendingEstimates.reduce((sum, item) => sum + item.totalCents, 0),
        jobsCompleted: completedMonth,
        completedDelta: percentDelta(completedMonth, completedYesterday),
        revenueToday: paidToday._sum.totalCents ?? 0,
        revenueDelta: percentDelta(paidToday._sum.totalCents ?? 0, paidYesterday._sum.totalCents ?? 0),
        billedHours,
        billedTarget: 160,
      }}
      todayJobs={todayCards}
      todayHolds={holds.map(toHoldCard)}
      resources={resourceCards}
      todayDate={formatDenverDateInput(new Date())}
      attention={{
        overdue,
        estimates: pendingEstimates.length,
        parts: waitingParts,
        unread,
        comebacks: disputes,
      }}
      activeJobs={activeList.map((job) => ({
        ...job,
        resourceName: job.resource?.name,
      }))}
      activity={activity}
    />
  );
}
