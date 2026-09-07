import { CustomerAppNav } from "@/components/layout/app-nav";
import { FixItWizard } from "@/components/intake/fix-it-wizard";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { assetLabel, vehicleLabel } from "@/lib/asset-display";

export const metadata = { title: "Inspect before you buy" };

export default async function InspectPage() {
  const session = await requireSession("CUSTOMER");
  const assets = await prisma.asset.findMany({
    where: { ownerId: session.id, status: "ACTIVE" },
    include: { industry: true, vehicle: { include: { make: true, model: true } } },
    orderBy: { createdAt: "desc" },
  });
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.id } });
  return (
    <div>
      <CustomerAppNav current="/inspect" />
      <h1 className="text-3xl font-bold text-ink">Inspect before you buy</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Same inspection, findings, recommendations, and estimate architecture as a repair. Risk scores are not shown as fact unless they come from recorded findings.
      </p>
      <FixItWizard
        assets={assets.map((asset) => ({
          id: asset.id,
          vehicleId: asset.vehicleId,
          label: asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset),
          industryKey: asset.industry.key,
        }))}
        defaultZip={profile?.zip ?? "84101"}
        requestKind="PRE_PURCHASE"
      />
    </div>
  );
}
