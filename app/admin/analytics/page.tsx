import Link from "next/link";
import { StatCard } from "@/components/layout/themed-board";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatAppointment, formatBoardDate } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  await requireSession("ADMIN");
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    jobsByStatus,
    estimatesByStatus,
    vehicles,
    messagesWeek,
    upcoming,
    completedTotals,
    threads,
  ] = await Promise.all([
    prisma.job.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.estimate.groupBy({ by: ["status"], _count: { _all: true }, _sum: { totalCents: true } }),
    prisma.vehicle.count(),
    prisma.message.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.job.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
      include: {
        customer: true,
        mechanicProfile: true,
        serviceRequest: true,
        vehicle: { include: { make: true, model: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 12,
    }),
    prisma.job.aggregate({ where: { status: "COMPLETED" }, _sum: { totalCents: true }, _count: true }),
    prisma.messageThread.count(),
  ]);

  const statusCount = (status: string) => jobsByStatus.find((row) => row.status === status)?._count._all ?? 0;
  const estimateCount = (status: string) => estimatesByStatus.find((row) => row.status === status)?._count._all ?? 0;
  const estimateSum = (status: string) => estimatesByStatus.find((row) => row.status === status)?._sum.totalCents ?? 0;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vehicles on file" value={vehicles} />
        <StatCard label="Message threads" value={threads} />
        <StatCard label="Messages last 7 days" value={messagesWeek} />
        <StatCard label="Completed volume" value={formatCents(completedTotals._sum.totalCents ?? 0)} />
        <StatCard label="Requested" value={statusCount("REQUESTED")} />
        <StatCard label="Scheduled" value={statusCount("SCHEDULED")} />
        <StatCard label="Estimates sent" value={estimateCount("SENT")} />
        <StatCard label="Estimates approved" value={estimateCount("APPROVED")} />
      </div>
      <p className="mt-2 text-sm text-muted">
        Approved quotes {formatCents(estimateSum("APPROVED"))} · awaiting approval {formatCents(estimateSum("SENT"))} ·{" "}
        {completedTotals._count} completed jobs
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-navy">Upcoming appointments</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Nothing on the book.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-paper">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="font-medium">Customer → Shop</th>
                  <th className="font-medium">Machine</th>
                  <th className="pr-4 font-medium">Work</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((job) => (
                  <tr key={job.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold text-navy">
                      {job.scheduledAt ? formatAppointment(job.scheduledAt) : formatBoardDate(job.updatedAt)}
                    </td>
                    <td>
                      <Link href={`/admin/jobs/${job.id}`} className="font-semibold text-navy hover:text-[#7eb0ff]">
                        {job.customer.firstName} {job.customer.lastName}
                      </Link>
                      <p className="text-xs text-muted">{job.mechanicProfile.businessName}</p>
                    </td>
                    <td>
                      {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                    </td>
                    <td className="pr-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{job.serviceRequest.problemText}</span>
                        <JobStatusLabel status={job.status} />
                      </div>
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
