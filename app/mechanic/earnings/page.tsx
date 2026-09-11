import { StatCard } from "@/components/layout/themed-board";
import { formatCents } from "@/lib/money";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id, status: "COMPLETED" },
    select: { totalCents: true },
  });
  const gross = jobs.reduce((sum, job) => sum + job.totalCents, 0);
  const commission = Math.round(gross * ((config?.commissionPercent ?? 10) / 100));
  return (
    <div>
      <p className="text-sm text-muted">
        Payments are not processed in this MVP. When Stripe Connect is enabled, payouts will use the same job totals and configurable commission.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StatCard label="Completed job volume" value={formatCents(gross)} />
        <StatCard label={`Platform commission (${config?.commissionPercent ?? 10}%)`} value={formatCents(commission)} />
        <StatCard label="Mechanic net" value={formatCents(gross - commission)} />
      </div>
    </div>
  );
}
