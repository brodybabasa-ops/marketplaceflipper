import { AppNav, ADMIN_NAV } from "@/components/layout/app-nav";
import { Card, KpiCard } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

export const metadata = { title: "HQ payments" };

export default async function HqPaymentsPage() {
  await requireSession(staffRoles());
  const [paid, pending, failed, payouts] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true, commissionCents: true } }),
    prisma.payout.aggregate({ where: { status: "PENDING" }, _sum: { amountCents: true } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payout.findMany({ take: 12, orderBy: { createdAt: "desc" }, include: { mechanic: true } }),
  ]);
  return (
    <div>
      <AppNav items={ADMIN_NAV} current="/admin/payments" />
      <h1 className="text-3xl font-bold text-ink">Payments</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="GMV" value={formatCents(paid._sum.amountCents ?? 0)} />
        <KpiCard label="Platform revenue" value={formatCents(paid._sum.commissionCents ?? 0)} />
        <KpiCard label="Pending payouts" value={formatCents(pending._sum.amountCents ?? 0)} />
        <KpiCard label="Failed payments" value={failed} />
      </div>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold">Recent payouts</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {payouts.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.mechanic.firstName} {item.mechanic.lastName}
              </span>
              <span className="number">{formatCents(item.amountCents)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
