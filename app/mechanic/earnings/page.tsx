import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { connectPayoutsAction } from "@/app/actions/phase2";

export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  const [jobs, payouts, payoutTotals] = await Promise.all([
    prisma.job.findMany({
      where: { mechanicProfileId: profile.id, status: "COMPLETED" },
      select: { totalCents: true, paymentStatus: true },
    }),
    prisma.payout.findMany({
      where: { mechanicUserId: session.id },
      include: { job: { include: { serviceRequest: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.payout.aggregate({
      where: { mechanicUserId: session.id, status: "PAID" },
      _sum: { amountCents: true },
    }),
  ]);
  const gross = jobs.reduce((sum, job) => sum + job.totalCents, 0);
  const paid = payoutTotals._sum.amountCents ?? 0;
  const commission = Math.round(gross * ((config?.commissionPercent ?? 10) / 100));
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <AppNav items={MECHANIC_NAV} current="/mechanic/earnings" />
      <h1 className="text-3xl font-bold text-navy">Earnings</h1>
      <p className="mt-2 text-sm text-muted">
        Stripe Connect destination charges: the customer pays the approved total. Pocket Mechanic keeps a configurable
        marketplace fee and the rest is recorded as your payout.
      </p>
      <Card className="mt-6 p-5">
        <p className="font-medium text-navy">
          {profile.stripeChargesEnabled ? "Payouts connected" : "Connect payouts"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {profile.stripeConnectAccountId
            ? `Account ${profile.stripeConnectAccountId}`
            : "Demo Connect onboarding. When Stripe keys are present, this creates an Express account."}
        </p>
        {!profile.stripeChargesEnabled ? (
          <form action={connectPayoutsAction} className="mt-3">
            <Button type="submit" size="sm">
              Connect Stripe
            </Button>
          </form>
        ) : null}
      </Card>
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
          <p className="text-sm text-muted">Paid out</p>
          <p className="number mt-1 text-2xl font-bold text-navy">{formatCents(paid)}</p>
        </Card>
      </div>
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy">Payouts</h2>
        <div className="mt-3 space-y-2">
          {payouts.map((payout) => (
            <Card key={payout.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium text-navy">{payout.job?.serviceRequest.problemText ?? "Payout"}</p>
                <p className="text-muted">
                  {payout.status.toLowerCase()} · fee {formatCents(payout.commissionCents)}
                </p>
              </div>
              <p className="number font-semibold">{formatCents(payout.amountCents)}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
