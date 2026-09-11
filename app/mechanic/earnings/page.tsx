import { Card } from "@/components/ui/card";
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-navy">Earnings</h1>
      <p className="mt-2 text-sm text-muted">
        Payments are not processed in this MVP. When Stripe Connect is enabled, payouts will use the same job totals and configurable commission.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">Completed job volume</p>
          <p className="number mt-1 text-2xl font-bold text-navy">{formatCents(gross)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Platform commission ({config?.commissionPercent ?? 10}%)</p>
          <p className="number mt-1 text-2xl font-bold text-navy">{formatCents(commission)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Mechanic net</p>
          <p className="number mt-1 text-2xl font-bold text-navy">{formatCents(gross - commission)}</p>
        </Card>
      </div>
    </div>
  );
}
