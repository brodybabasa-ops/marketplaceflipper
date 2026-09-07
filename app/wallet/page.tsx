import { CustomerAppNav } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { FutureSurface, DemoBanner } from "@/components/ui/vision";
import { visionFixtures } from "@/lib/vision-fixtures";
import { isVisionDemoEnabled } from "@/lib/vision";

export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const session = await requireSession("CUSTOMER");
  const payments = await prisma.payment.findMany({
    where: { customerId: session.id },
    include: { job: { include: { mechanicProfile: true } } },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const wallet = await prisma.walletAccount.findUnique({
    where: { userId: session.id },
    include: { entries: { orderBy: { createdAt: "desc" }, take: 12 } },
  });
  const fixtures = isVisionDemoEnabled() ? visionFixtures() : null;
  return (
    <div>
      <CustomerAppNav current="/wallet" />
      <h1 className="text-3xl font-bold text-ink">Pocket Mechanic Wallet</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Repair payments, receipts, refunds, and a future maintenance fund. Pocket Mechanic is not a bank and is not the lender.
      </p>
      {fixtures ? (
        <div className="mt-4">
          <DemoBanner>{fixtures.walletNote}</DemoBanner>
        </div>
      ) : null}
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Repair payments</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No payments on this account yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {payments.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.job.mechanicProfile.businessName} · {item.kind.toLowerCase()} · {item.status.toLowerCase()}
                </span>
                <span className="number">{formatCents(item.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {wallet?.entries.length ? (
        <Card className="mt-4 p-5">
          <h2 className="font-semibold text-ink">Ledger</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {wallet.entries.map((entry) => (
              <li key={entry.id} className="flex justify-between">
                <span>
                  {entry.kind.replaceAll("_", " ").toLowerCase()}
                  {entry.provenance === "DEMO_FIXTURE" ? " · fixture" : ""}
                </span>
                <span className="number">{formatCents(entry.amountCents)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <div className="mt-6">
        <FutureSurface
          title="Maintenance fund"
          body="A customer could allocate $100/month toward future service through a regulated partner. This screen is architecture, not a deposit product."
        />
      </div>
    </div>
  );
}
