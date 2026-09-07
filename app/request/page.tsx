import { CustomerAppNav } from "@/components/layout/app-nav";
import { IntakeForm } from "@/components/intake/intake-form";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { assetLabel, vehicleLabel } from "@/lib/asset-display";
import { industryByKey } from "@/lib/catalog";

export const metadata = { title: "Request service" };

export default async function RequestPage({
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
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <CustomerAppNav current="/request" />
      <h1 className="text-3xl font-bold text-ink">{copy.intakePrompt}</h1>
      <p className="mt-2 text-sm text-muted">Use everyday language. Pocket Mechanic matches providers — it does not diagnose.</p>
      {assets.length ? (
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
      ) : (
        <p className="mt-6 text-sm text-muted">Add a vehicle to your garage first.</p>
      )}
    </div>
  );
}
