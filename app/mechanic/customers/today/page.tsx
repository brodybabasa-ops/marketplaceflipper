import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { getMechanicCrm } from "@/services/crm";
import { formatCents } from "@/lib/money";

export const metadata = { title: "CRM Today" };

export default async function CrmTodayPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const crm = await getMechanicCrm(profile.id, session.id);
  const queue = crm.customers.filter((item) => item.nextAction !== "None");
  return (
    <div>
      <MechanicAppNav current="/mechanic/customers" />
      <h1 className="text-3xl font-bold text-ink">{queue.length} customers need attention</h1>
      <p className="mt-2 text-sm text-muted">Work one actionable customer at a time.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Recommended services" value={crm.attention.recommended} />
        <KpiCard label="Estimates unanswered" value={crm.attention.estimates} />
        <KpiCard label="Unpaid invoices" value={crm.attention.unpaid} />
        <KpiCard label="Potential revenue" value={formatCents(crm.attention.potential)} />
      </div>
      <div className="mt-8 space-y-3">
        {queue.slice(0, 1).map((item) => (
          <div key={item.id} className="rounded-2xl border border-line bg-card p-5">
            <p className="text-sm uppercase tracking-wide text-warning">Next</p>
            <p className="mt-1 text-2xl font-bold text-ink">{item.name}</p>
            <p className="text-muted">{item.nextAction}</p>
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href={`/mechanic/customers/${item.id}`}>Work this customer</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/mechanic/customers?tab=followups">See full list</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
