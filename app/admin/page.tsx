import { Card } from "@/components/ui/card";
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
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-navy">Platform overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total users", users],
          ["Mechanics", mechanics],
          ["Verified mechanics", verified],
          ["Jobs", jobs],
          ["Completed jobs", completed],
          ["Cancellation rate", jobs ? `${Math.round((cancelled / jobs) * 100)}%` : "0%"],
          ["Average rating", (reviews._avg.overallRating ?? 0).toFixed(1)],
          ["Open disputes", disputes],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="number mt-1 text-3xl font-bold text-navy">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
