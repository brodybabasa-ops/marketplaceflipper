import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { assetLabel, formatUsage, vehicleLabel } from "@/lib/asset-display";
import { healthFromFindings } from "@/services/assets";

export const metadata = { title: "Garage item" };

export default async function GarageItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("CUSTOMER");
  const { id } = await params;
  const asset = await prisma.asset.findFirst({
    where: { ownerId: session.id, OR: [{ id }, { vehicleId: id }] },
    include: {
      industry: true,
      assetType: true,
      identifiers: true,
      components: true,
      vehicle: { include: { make: true, model: true } },
      repairRecords: { include: { job: { include: { mechanicProfile: true } } }, orderBy: { createdAt: "desc" } },
      inspections: { include: { findings: true }, orderBy: { createdAt: "desc" } },
      recommendedWork: { where: { status: "OPEN" } },
    },
  });
  if (!asset) notFound();
  const title = asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset);
  const health = healthFromFindings(asset.inspections.flatMap((item) => item.findings));
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <AppNav items={CUSTOMER_NAV} current="/vehicles" />
      <Badge tone="muted">{asset.industry.name}</Badge>
      <h1 className="mt-2 text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-1 text-muted">
        {asset.assetType.name}
        {asset.usageValue != null ? ` · ${formatUsage(asset.usageValue, asset.usageUnit)}` : ""}
      </p>
      <Button asChild className="mt-4">
        <Link href={`/intake?asset=${asset.id}`}>Get help</Link>
      </Button>

      {asset.identifiers.length ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">Identifiers</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {asset.identifiers.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span className="text-muted">{item.label || item.kind.replaceAll("_", " ")}</span>
                <span className="number">{item.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {asset.components.length ? (
        <Card className="mt-4 p-5">
          <h2 className="font-semibold text-ink">Components</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {asset.components.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {health.sections.length ? (
        <Card className="mt-4 p-5">
          <h2 className="font-semibold text-ink">From inspections</h2>
          <p className="mt-1 text-xs text-muted">Shown only from recorded findings — Pocket Mechanic does not invent a score.</p>
          <ul className="mt-3 space-y-1 text-sm">
            {health.sections.map((section) => (
              <li key={section.section} className="flex justify-between">
                <span>{section.section}</span>
                <span className="uppercase text-muted">{section.status.replaceAll("_", " ").toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {asset.recommendedWork.length ? (
        <Card className="mt-4 p-5">
          <h2 className="font-semibold text-ink">Open recommendations</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {asset.recommendedWork.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="mt-4 p-5">
        <h2 className="font-semibold text-ink">Service history</h2>
        {asset.repairRecords.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No verified service records yet.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {asset.repairRecords.map((record) => (
              <li key={record.id}>
                <p className="font-semibold">{record.title}</p>
                <p className="text-muted">
                  {record.job.mechanicProfile.businessName}
                  {record.createdAt ? ` · ${record.createdAt.toLocaleDateString()}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
