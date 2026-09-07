import Link from "next/link";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { FixItWizard } from "@/components/intake/fix-it-wizard";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { assetLabel, vehicleLabel } from "@/lib/asset-display";
import { industryByKey } from "@/lib/catalog";

export const metadata = { title: "Fix It" };

export default async function FixItPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string; mechanic?: string; asset?: string; kind?: string; urgent?: string; q?: string }>;
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
  const urgent = params.urgent === "1";
  const kind = params.kind === "ppi" ? "PRE_PURCHASE" : params.kind === "maintenance" ? "MAINTENANCE" : "REPAIR";

  return (
    <div>
      <CustomerAppNav current="/fix" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {urgent ? "Urgent help" : kind === "PRE_PURCHASE" ? "Inspect before you buy" : "Fix It"}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-ink">
        {kind === "PRE_PURCHASE" ? "Inspect it before you buy." : urgent ? "I need help now." : "Whatever you own. Whatever’s wrong with it."}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {copy.intakePrompt} Pocket Mechanic routes you to qualified providers and explains why — it does not diagnose from a description.
      </p>
      <FixItWizard
        assets={assets.map((asset) => ({
          id: asset.id,
          vehicleId: asset.vehicleId,
          label: asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset),
          industryKey: asset.industry.key,
        }))}
        defaultAssetId={defaultAsset?.id}
        defaultProblem={params.q}
        mechanicProfileId={params.mechanic}
        defaultZip={profile?.zip ?? "84101"}
        urgency={urgent ? "URGENT" : "NORMAL"}
        requestKind={kind === "PRE_PURCHASE" || kind === "MAINTENANCE" ? kind : "REPAIR"}
      />
      <p className="mt-6 text-xs text-muted">
        Prefer the classic form? <Link className="text-accent" href="/intake">Open issue intake</Link>
      </p>
    </div>
  );
}
