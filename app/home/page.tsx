import Link from "next/link";
import { GarageCard } from "@/components/jobs/garage-card";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { JobStatusLabel, jobProgressPercent } from "@/components/jobs/status-timeline";
import { FixItHero } from "@/components/home/fix-it-hero";
import { DemoBanner } from "@/components/ui/vision";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { jobAssetLabel } from "@/lib/asset-display";
import { garageCardCopy, listGarage } from "@/services/assets";
import { garageMaintenance } from "@/services/maintenance";
import { isVisionDemoEnabled } from "@/lib/vision";
import { visionFixtures } from "@/lib/vision-fixtures";

export const metadata = { title: "Home" };

export default async function CustomerHomePage() {
  const session = await requireSession("CUSTOMER");
  const [garage, jobs, repairs, unpaid, maintenance, recommended] = await Promise.all([
    listGarage(session.id),
    prisma.job.findMany({
      where: { customerId: session.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } }, asset: true, serviceRequest: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.repairRecord.findMany({
      where: { OR: [{ vehicle: { customerId: session.id } }, { asset: { ownerId: session.id } }] },
      include: { job: { include: { mechanicProfile: true, outcome: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.job.findMany({
      where: { customerId: session.id, status: "COMPLETED", paymentStatus: { not: "PAID" }, totalCents: { gt: 0 } },
      include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } }, asset: true },
      take: 3,
    }),
    garageMaintenance(session.id),
    prisma.recommendedWork.findMany({
      where: { customerId: session.id, status: "OPEN" },
      select: { estimatedCents: true },
    }),
  ]);
  const recommendedCents = recommended.reduce((sum, item) => sum + item.estimatedCents, 0);
  const fixtures = isVisionDemoEnabled() ? visionFixtures() : null;
  const cards = garage.assets.map((asset) => garageCardCopy(asset));

  return (
    <div>
      <section className="overflow-hidden rounded-3xl border border-line bg-navy p-5 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Whatever you own. Whatever’s wrong with it.</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink md:text-5xl">
              Fix It.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted">
              {garage.headline.body} Describe the problem in everyday language. Pocket Mechanic finds the right people — it does not diagnose from a description.
            </p>
            <FixItHero defaultAssetId={garage.assets[0]?.id} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/help-now" className="rounded-2xl border border-line bg-slate p-4 hover:border-accent/50">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-warning">Need help now?</p>
              <p className="mt-1 font-semibold text-ink">Roadside & towing</p>
              <p className="mt-1 text-sm text-muted">Urgent matching for breakdowns, jumps, and tows.</p>
            </Link>
            <Link href="/inspect" className="rounded-2xl border border-line bg-slate p-4 hover:border-accent/50">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Inspect before you buy</p>
              <p className="mt-1 font-semibold text-ink">Pre-purchase inspection</p>
              <p className="mt-1 text-sm text-muted">Same inspection architecture. No invented risk scores.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{garage.headline.title}</h2>
          <Link className="text-sm font-semibold text-accent" href="/vehicles">
            Open garage
          </Link>
        </div>
        {cards.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Add your first vehicle" body="Year, make, and model is enough.">
              <Button asChild>
                <Link href="/vehicles/new">Add a vehicle</Link>
              </Button>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
            {cards.map((card) => (
              <GarageCard key={card.id} card={card} href={`/vehicles/${card.vehicleId ?? card.id}`} ctaHref={`/fix?asset=${card.id}`} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <Card className="p-5" id="maintenance">
          <h2 className="font-semibold text-ink">Upcoming for you</h2>
          <div className="mt-4 space-y-3">
            {maintenance.length === 0 ? (
              <p className="text-sm text-muted">No due items from your records yet. Pocket Mechanic does not invent a schedule.</p>
            ) : (
              maintenance.slice(0, 4).map((item) => (
                <div key={item.assetId + item.title} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="text-xs text-muted">{item.assetLabel} · {item.remainingLabel}</p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/fix?asset=${item.assetId}&kind=maintenance`}>Schedule</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink">Maintenance estimate</h2>
          {recommendedCents > 0 ? (
            <>
              <p className="number mt-3 text-3xl font-bold text-ink">{formatCents(recommendedCents)}</p>
              <p className="mt-1 text-xs text-muted">Open recommended work from Pocket Mechanic jobs on this account.</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">Dollar estimates appear after a provider records recommended work. Nothing is invented here.</p>
          )}
          {fixtures?.maintenanceOutlook ? (
            <div className="mt-4">
              <DemoBanner>{fixtures.maintenanceOutlook.note}</DemoBanner>
              <div className="mt-3 flex h-24 items-end gap-2">
                {fixtures.maintenanceOutlook.bars.map((bar) => (
                  <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg bg-accent/80" style={{ height: `${bar.height}%` }} />
                    <span className="text-[10px] text-muted">{bar.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Illustration {formatCents(fixtures.maintenanceOutlook.minCents)}–{formatCents(fixtures.maintenanceOutlook.maxCents)}
              </p>
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink">Active repairs</h2>
          <div className="mt-4 space-y-3">
            {jobs.length === 0 ? (
              <p className="text-sm text-muted">No active repairs. When you Fix It, tracking lives here.</p>
            ) : (
              jobs.map((job) => {
                const percent = jobProgressPercent(job.status);
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-xl border border-line bg-navy-soft p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{job.serviceRequest.problemText}</p>
                      <JobStatusLabel status={job.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{jobAssetLabel(job)} · {job.mechanicProfile.businessName}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                    </div>
                  </Link>
                );
              })
            )}
            {unpaid.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}/pay`} className="block rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
                Pay {formatCents(job.totalCents)} · {job.mechanicProfile.businessName}
              </Link>
            ))}
          </div>
        </Card>
      </section>

      {repairs.length ? (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">Recent activity</h2>
            <Link className="text-sm font-semibold text-accent" href="/history">
              History
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {repairs.map((record) => (
              <Link key={record.id} href={`/jobs/${record.jobId}`} className="rounded-2xl border border-line bg-card p-4">
                <p className="font-semibold text-ink">{record.title}</p>
                <p className="text-sm text-muted">{record.job.mechanicProfile.businessName}</p>
                {record.job.outcome ? (
                  <p className="mt-1 text-xs text-muted">Outcome: {record.job.outcome.resolved.toLowerCase()}</p>
                ) : (
                  <p className="mt-1 text-xs text-warning">Did this repair solve the original problem?</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
