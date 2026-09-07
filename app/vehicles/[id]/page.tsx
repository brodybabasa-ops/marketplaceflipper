import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { assetLabel, formatUsage, vehicleLabel } from "@/lib/asset-display";
import { formatCents } from "@/lib/money";
import { getAssetHome, verifiedServiceReport } from "@/services/asset-lifecycle";
import { transferAssetAction } from "@/app/actions/vision";
import { FutureSurface } from "@/components/ui/vision";

export const metadata = { title: "Asset" };

const SECTIONS = [
  ["overview", "Overview"],
  ["health", "Health"],
  ["maintenance", "Maintenance"],
  ["repairs", "Repairs"],
  ["history", "History"],
  ["warranties", "Warranties"],
  ["documents", "Documents"],
  ["report", "Report"],
] as const;

export default async function GarageItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession("CUSTOMER");
  const { id } = await params;
  const { tab: raw } = await searchParams;
  const assetRow = await prisma.asset.findFirst({
    where: { ownerId: session.id, OR: [{ id }, { vehicleId: id }] },
    select: { id: true, vehicleId: true },
  });
  if (!assetRow) notFound();
  const home = await getAssetHome(assetRow.id, session.id);
  if (!home) notFound();
  const { asset, warranties, health, maintenance, spend } = home;
  const title = asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset);
  const tab = SECTIONS.some(([key]) => key === raw) ? raw : "overview";
  const report = tab === "report" ? await verifiedServiceReport(asset.id, session.id) : null;
  const href = (value: string) => `/vehicles/${asset.vehicleId ?? asset.id}?tab=${value}`;

  return (
    <div className="mx-auto max-w-3xl">
      <CustomerAppNav current="/vehicles" />
      <Badge tone="muted">{asset.industry.name}</Badge>
      <h1 className="mt-2 text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-1 text-muted">
        {asset.assetType.name}
        {asset.usageValue != null ? ` · ${formatUsage(asset.usageValue, asset.usageUnit)}` : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/fix?asset=${asset.id}`}>Fix It</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/fix?asset=${asset.id}&kind=maintenance`}>Handle my maintenance</Link>
        </Button>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto text-sm">
        {SECTIONS.map(([key, label]) => (
          <Link
            key={key}
            href={href(key)}
            className={`rounded-full px-3 py-1.5 ${tab === key ? "bg-accent text-white" : "bg-slate text-muted"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="mt-6 space-y-4">
          {asset.identifiers.length ? (
            <Card className="p-5">
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
          {asset.jobs[0] ? (
            <Card className="p-5">
              <h2 className="font-semibold text-ink">Active repair</h2>
              <p className="mt-2 text-sm">{asset.jobs[0].serviceRequest.problemText}</p>
              <p className="text-sm text-muted">{asset.jobs[0].mechanicProfile.businessName}</p>
              <Button asChild size="sm" className="mt-3">
                <Link href={`/jobs/${asset.jobs[0].id}`}>Track</Link>
              </Button>
            </Card>
          ) : null}
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Repair costs</h2>
            <p className="number mt-2 text-2xl font-bold">{formatCents(spend)}</p>
            <p className="text-xs text-muted">From verified Pocket Mechanic jobs on this asset. No estimated market value is shown.</p>
          </Card>
          {asset.preferredProviders[0] ? (
            <p className="text-sm text-muted">My mechanic: {asset.preferredProviders[0].mechanic.businessName}</p>
          ) : null}
          <FutureSurface
            title="Recalls & campaigns"
            body="When manufacturer data is connected, Pocket Mechanic will surface recalls, service campaigns, and repairs that may be covered at no charge. Trust beats monetizing every job. No recall feed is connected yet."
          />
          <FutureSurface
            title="Should I fix this?"
            body="Repair vs replace needs a legitimate valuation partner plus verified repair costs and upcoming maintenance. Pocket Mechanic will explain the tradeoff — it will not make an absolute decision or invent a value."
          />
        </div>
      ) : null}

      {tab === "health" ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">From inspections</h2>
          {health.score != null ? (
            <p className="number mt-2 text-3xl font-bold text-ink">
              {health.score}<span className="text-base font-medium text-muted">/100 · {health.label}</span>
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted">Pocket Mechanic does not invent a health score. This is only recorded findings.</p>
          {health.sections.length ? (
            <ul className="mt-3 space-y-1 text-sm">
              {health.sections.map((section) => (
                <li key={section.section} className="flex justify-between">
                  <span>{section.section}</span>
                  <span className="uppercase text-muted">{section.status.replaceAll("_", " ").toLowerCase()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No inspection findings yet" body="Health appears after a provider records a digital inspection." />
          )}
        </Card>
      ) : null}

      {tab === "maintenance" ? (
        <div className="mt-6 space-y-3">
          {maintenance.length === 0 ? (
            <EmptyState title="No maintenance due from records" body="Intervals come from manufacturer-style rules and provider recommendations — not invented failures." />
          ) : (
            maintenance.map((item) => (
              <Card key={item.title + item.source} className="p-4">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="text-sm text-muted">{item.remainingLabel} · {item.status.replaceAll("_", " ").toLowerCase()}</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href={`/fix?asset=${asset.id}&kind=maintenance`}>Request this service</Link>
                </Button>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {tab === "repairs" ? (
        <div className="mt-6 space-y-3">
          {asset.jobs.length === 0 && asset.recommendedWork.length === 0 ? (
            <EmptyState title="No active repairs" body="Open Fix It when something needs work.">
              <Button asChild>
                <Link href={`/fix?asset=${asset.id}`}>Fix It</Link>
              </Button>
            </EmptyState>
          ) : null}
          {asset.jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
              <p className="font-semibold">{job.serviceRequest.problemText}</p>
              <p className="text-sm text-muted">{job.mechanicProfile.businessName} · {job.status.replaceAll("_", " ").toLowerCase()}</p>
            </Link>
          ))}
          {asset.recommendedWork.map((item) => (
            <Card key={item.id} className="p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted">Declined / recommended · {item.mechanic.businessName}</p>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "history" ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">Verified service history</h2>
          {asset.repairRecords.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No verified service records yet.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {asset.repairRecords.map((record) => (
                <li key={record.id}>
                  <Link href={`/jobs/${record.jobId}`} className="font-semibold text-ink">
                    {record.title}
                  </Link>
                  <p className="text-muted">
                    {record.job.mechanicProfile.businessName} · {record.createdAt.toLocaleDateString()} · {formatCents(record.job.totalCents)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {tab === "warranties" ? (
        <div className="mt-6 space-y-3">
          {warranties.length === 0 ? (
            <EmptyState title="No warranties on file" body="Warranties attach to completed Pocket Mechanic repairs. They are not invented." />
          ) : (
            warranties.map((item) => (
              <Card key={item.id} className="p-4">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="text-sm text-muted">
                  Parts: {item.partsCoverage ?? "—"} · Labor: {item.laborCoverage ?? "—"}
                </p>
                <p className="text-sm text-muted">Provider: {item.providerName}</p>
                {item.isDemoFixture ? <p className="mt-1 text-xs text-warning">Development fixture</p> : null}
              </Card>
            ))
          )}
        </div>
      ) : null}

      {tab === "documents" ? (
        <div className="mt-6 space-y-3">
          {asset.documents.length === 0 ? (
            <EmptyState title="Document vault is empty" body="Titles, receipts, and manuals can live here. Sensitive documents are never required." />
          ) : (
            asset.documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <p className="font-semibold">{doc.title}</p>
                <p className="text-xs text-muted">{doc.kind.toLowerCase()}</p>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {tab === "report" && report ? (
        <div className="mt-6 space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Verified service report</h2>
            <p className="mt-1 text-sm text-muted">
              {report.verifiedRecords} verified records · {report.usage ?? "usage not on file"}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {report.history.map((item) => (
                <li key={item.date.toISOString()}>
                  {item.title} · {item.provider} · {formatCents(item.amountCents)}
                </li>
              ))}
            </ul>
            {report.unresolved.length ? (
              <p className="mt-3 text-sm text-warning">Unresolved: {report.unresolved.join(", ")}</p>
            ) : (
              <p className="mt-3 text-sm text-muted">No unresolved recommendations.</p>
            )}
            <p className="mt-3 text-xs text-muted">{report.privacyNote}</p>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Transfer asset</h2>
            <p className="mt-1 text-sm text-muted">Ownership moves. Customer contact and payment details do not.</p>
            <form action={transferAssetAction} className="mt-3 space-y-3">
              <input type="hidden" name="assetId" value={asset.id} />
              <Field label="New owner email">
                <Input name="toEmail" type="email" required placeholder="buyer@example.com" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="includeHistory" defaultChecked className="h-4 w-4" />
                Include verified service history
              </label>
              <Button type="submit" variant="secondary">
                Transfer
              </Button>
            </form>
          </Card>
          <FutureSurface
            title="Asset value & sell / trade"
            body="Estimated value, Get Offers, and trade-in require market-data partners. Pocket Mechanic will not fabricate a number."
          />
        </div>
      ) : null}
    </div>
  );
}
