import { StatCard } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  await requireSession("ADMIN");
  const [users, mechanics, verified, jobs, completed, disputes, reviews] = await Promise.all([
    prisma.user.count(),
    prisma.mechanicProfile.count(),
    prisma.mechanicProfile.count({ where: { verificationLevel: { not: "UNVERIFIED" } } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: "COMPLETED" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.review.aggregate({ _avg: { overallRating: true } }),
  ]);
  const cancelled = await prisma.job.count({ where: { status: "CANCELLED" } });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total users" value={users} />
      <StatCard label="Mechanics" value={mechanics} />
      <StatCard label="Verified mechanics" value={verified} />
      <StatCard label="Jobs" value={jobs} />
      <StatCard label="Completed jobs" value={completed} />
      <StatCard label="Cancellation rate" value={jobs ? `${Math.round((cancelled / jobs) * 100)}%` : "0%"} />
      <StatCard label="Average rating" value={(reviews._avg.overallRating ?? 0).toFixed(1)} />
      <StatCard label="Open disputes" value={disputes} />
    </div>
  );
}
