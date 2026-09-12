import Link from "next/link";
import { StatCard } from "@/components/layout/themed-board";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  await requireSession("ADMIN");
  const [users, mechanics, verified, jobs, completed, disputes, pendingVerifications, recentJobs, openDisputes, vehicles, threads] =
    await Promise.all([
      prisma.user.count(),
      prisma.mechanicProfile.count(),
      prisma.mechanicProfile.count({ where: { verificationLevel: { not: "UNVERIFIED" } } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.job.findMany({
        include: { customer: true, mechanicProfile: true, serviceRequest: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.dispute.findMany({
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        include: { customer: true, mechanic: true, job: { include: { serviceRequest: true } } },
        take: 5,
      }),
      prisma.vehicle.count(),
      prisma.messageThread.count(),
    ]);
  const cancelled = await prisma.job.count({ where: { status: "CANCELLED" } });
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={users} />
        <StatCard label="Shops" value={mechanics} />
        <StatCard label="Verified shops" value={verified} />
        <StatCard label="Open disputes" value={disputes} />
        <StatCard label="Jobs" value={jobs} />
        <StatCard label="Vehicles" value={vehicles} />
        <StatCard label="Threads" value={threads} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="Cancellation rate" value={jobs ? `${Math.round((cancelled / jobs) * 100)}%` : "0%"} />
        <StatCard label="Pending verifications" value={pendingVerifications} />
      </div>

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="rounded-xl border border-line bg-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">Recent jobs</h2>
            <Link className="text-sm font-semibold text-[#7eb0ff]" href="/admin/jobs">
              All jobs →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="pb-2 font-medium">Work</th>
                  <th className="font-medium">Customer → Shop</th>
                  <th className="font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-3 font-medium text-navy">
                      <Link href={`/admin/jobs/${job.id}`} className="hover:text-[#7eb0ff]">
                        {job.serviceRequest.problemText}
                      </Link>
                    </td>
                    <td className="pr-3 text-muted">
                      {job.customer.firstName} → {job.mechanicProfile.businessName}
                    </td>
                    <td>
                      <JobStatusLabel status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-xl border border-line bg-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">Needs a decision</h2>
            <Link className="text-sm font-semibold text-[#7eb0ff]" href="/admin/disputes">
              Disputes →
            </Link>
          </div>
          {openDisputes.length === 0 && pendingVerifications === 0 ? (
            <p className="py-6 text-sm text-muted">Nothing waiting on admin.</p>
          ) : (
            <div className="space-y-3">
              {pendingVerifications > 0 ? (
                <Link href="/admin/verification" className="block rounded-lg bg-card px-3 py-3 hover:bg-[#071422]">
                  <p className="font-semibold text-navy">{pendingVerifications} verification{pendingVerifications === 1 ? "" : "s"} pending</p>
                  <p className="text-sm text-muted">Approve or reject shop checks.</p>
                </Link>
              ) : null}
              {openDisputes.map((dispute) => (
                <Link key={dispute.id} href="/admin/disputes" className="block rounded-lg bg-card px-3 py-3 hover:bg-[#071422]">
                  <p className="font-semibold text-navy">
                    {dispute.category.replaceAll("_", " ")} · {dispute.status.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <p className="text-sm text-muted">
                    {dispute.customer.email} vs shop · {dispute.job.serviceRequest.problemText}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
