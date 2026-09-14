import { ShopEarningsView } from "@/components/shop-os/earnings-view";
import { formatCents } from "@/lib/money";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { specialtyLabel } from "@/lib/landing";

export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  const [paidJobs, payouts] = await Promise.all([
    prisma.job.findMany({
      where: { mechanicProfileId: profile.id, paymentStatus: "PAID" },
      include: { serviceRequest: true },
    }),
    prisma.payout.findMany({
      where: { mechanicUserId: session.id },
      include: { job: { include: { serviceRequest: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  const gross = paidJobs.reduce((sum, job) => sum + job.totalCents, 0);
  const commission = Math.round(gross * ((config?.commissionPercent ?? 10) / 100));
  const byCategory = new Map<string, { jobs: number; revenue: number }>();
  for (const job of paidJobs) {
    const label = specialtyLabel(job.serviceRequest.category);
    const current = byCategory.get(label) ?? { jobs: 0, revenue: 0 };
    current.jobs += 1;
    current.revenue += job.totalCents;
    byCategory.set(label, current);
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthly = months.map((label, index) => ({
    label,
    cents: paidJobs
      .filter((job) => job.completedAt?.getUTCMonth() === index || (!job.completedAt && job.updatedAt.getUTCMonth() === index))
      .reduce((sum, job) => sum + job.totalCents, 0),
  }));
  return (
    <ShopEarningsView
      gross={gross}
      commission={commission}
      net={gross - commission}
      completedJobs={paidJobs.length}
      averageJob={paidJobs.length ? Math.round(gross / paidJobs.length) : 0}
      commissionPercent={config?.commissionPercent ?? 10}
      payouts={
        payouts.length
          ? payouts.map((payout) => ({
              id: payout.id,
              amountCents: payout.amountCents,
              status: payout.status,
              createdAt: payout.createdAt,
              jobLabel: payout.job?.serviceRequest.problemText,
            }))
          : paidJobs.length
            ? [
                {
                  id: "net",
                  amountCents: gross - commission,
                  status: "PENDING",
                  createdAt: new Date(),
                  jobLabel: `${paidJobs.length} paid jobs · mock payout`,
                },
              ]
            : []
      }
      topServices={[...byCategory.entries()]
        .map(([label, value]) => ({ label, ...value }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6)}
      monthly={monthly}
    />
  );
}
