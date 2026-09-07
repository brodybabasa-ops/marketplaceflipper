import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { IntakeForm } from "@/components/intake/intake-form";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { assetLabel, vehicleLabel } from "@/lib/asset-display";
import { industryByKey } from "@/lib/catalog";

export const metadata = { title: "What’s going on?" };

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string; mechanic?: string; asset?: string }>;
}) {
  const session = await requireSession("CUSTOMER");
  const params = await searchParams;
  const assets = await prisma.asset.findMany({
    where: { ownerId: session.id, status: "ACTIVE" },
    include: { industry: true, vehicle: { include: { make: true, model: true } } },
    orderBy: { createdAt: "desc" },
  });
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.id } });
  const defaultAsset =
    assets.find((item) => item.id === params.asset || item.vehicleId === params.vehicle) ?? assets[0];
  const copy = industryByKey(defaultAsset?.industry.key ?? "AUTOMOTIVE");
  const mixed = new Set(assets.map((item) => item.industry.key)).size > 1;

  return (
    <div>
      <AppNav items={CUSTOMER_NAV} current="/intake" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Issue intake</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">{mixed ? "What’s going on?" : copy.intakePrompt}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Everyday language is enough. Pocket Mechanic uses this to match the right provider — it is not a diagnosis.
      </p>
      {assets.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Add something to your garage first.</p>
      ) : (
        <IntakeForm
          assets={assets.map((asset) => ({
            id: asset.id,
            vehicleId: asset.vehicleId,
            label: asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset),
            industryKey: asset.industry.key,
          }))}
          defaultAssetId={defaultAsset?.id}
          mechanicProfileId={params.mechanic}
          defaultZip={profile?.zip ?? "84101"}
        />
      )}
    </div>
  );
}
