import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireSession("ADMIN");
  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-navy">Platform settings</h1>
      <Card className="mt-6 space-y-2 p-5 text-sm">
        <p>Marketplace commission: {config?.commissionPercent}%</p>
        <p>Mechanic Pro: {formatCents(config?.mechanicProMonthlyCents ?? 4900)} / month</p>
        <p>Ranking weights are stored in PlatformConfig.rankingWeights and are not payable.</p>
        <p className="text-muted">Stripe, Resend, and Twilio adapters are inactive until environment keys are provided.</p>
      </Card>
    </div>
  );
}
