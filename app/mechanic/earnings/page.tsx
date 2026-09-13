import { StatCard } from "@/components/layout/themed-board";
import { formatCents } from "@/lib/money";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  const [paidJobs, pendingPayouts] = await Promise.all([
    prisma.job.findMany({
      where: { mechanicProfileId: profile.id, paymentStatus: "PAID" },
      select: { totalCents: true },
    }),
    prisma.payout.aggregate({
      where: { mechanicUserId: session.id, status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { amountCents: true },
    }),
  ]);
  const gross = paidJobs.reduce((sum, job) => sum + job.totalCents, 0);
  const commission = Math.round(gross * ((config?.commissionPercent ?? 10) / 100));
  return (
    <div>
      <p className="text-sm text-muted">
        Paid jobs settle on the job record now. Stripe Connect will move these same totals when keys are added; until then checkout uses the mock processor.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StatCard label="Paid volume" value={formatCents(gross)} />
        <StatCard label={`Platform commission (${config?.commissionPercent ?? 10}%)`} value={formatCents(commission)} />
        <StatCard label="Pending payout" value={formatCents(pendingPayouts._sum.amountCents ?? gross - commission)} />
      </div>
    </div>
  );
}
