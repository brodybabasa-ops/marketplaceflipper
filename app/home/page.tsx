import Link from "next/link";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { GarageCard } from "@/components/jobs/garage-card";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { jobAssetLabel } from "@/lib/asset-display";
import { garageCardCopy, listGarage } from "@/services/assets";
import { garageMaintenance } from "@/services/maintenance";

export const metadata = { title: "Home" };

export default async function CustomerHomePage() {
  const session = await requireSession("CUSTOMER");
  const [garage, jobs, repairs, unpaid, maintenance] = await Promise.all([
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
  ]);
  const needsAttention = [
    ...unpaid.map((job) => ({ href: `/jobs/${job.id}/pay`, label: `Pay ${formatCents(job.totalCents)} · ${job.mechanicProfile.businessName}` })),
    ...maintenance.filter((item) => item.status === "DUE" || item.status === "OVERDUE").map((item) => ({
      href: `/fix?asset=${item.assetId}&kind=maintenance`,
      label: `${item.title} · ${item.assetLabel}`,
    })),
    ...garage.assets.filter((asset) => asset.recommendedWork.length).map((asset) => ({
      href: `/vehicles/${asset.vehicleId ?? asset.id}`,
      label: `${garageCardCopy(asset).title} has open recommendations`,
    })),
  ];

  return (
    <div>
      <CustomerAppNav current="/home" />
      <h1 className="text-3xl font-bold text-ink">Whatever you own. Whatever’s wrong with it.</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {garage.headline.body} Pocket Mechanic handles matching, approval, payment, and history.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/fix">Fix It</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/vehicles">{garage.headline.title}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/help-now">Urgent help</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/inspect">Inspect before buying</Link>
        </Button>
      </div>

      {needsAttention.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Needs attention</h2>
          <div className="mt-4 space-y-2">
            {needsAttention.slice(0, 6).map((item) => (
              <Link key={item.href + item.label} href={item.href} className="block rounded-2xl border border-line bg-card p-4 text-sm text-ink">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-10">
          <EmptyState title="You’re clear" body="Nothing needs attention right now. Fix It is one tap when something breaks." />
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{garage.headline.title}</h2>
          <Link className="text-sm font-semibold text-accent" href="/vehicles">
            Open garage
          </Link>
        </div>
        {garage.assets.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Add your first vehicle" body="Year, make, and model is enough.">
              <Button asChild>
                <Link href="/vehicles/new">Add a vehicle</Link>
              </Button>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {garage.assets.slice(0, 6).map((asset) => {
              const card = garageCardCopy(asset);
              return <GarageCard key={asset.id} card={card} href={`/vehicles/${asset.vehicleId ?? asset.id}`} ctaHref={`/fix?asset=${asset.id}`} ctaLabel="Fix It" />;
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-ink">Active repairs</h2>
        <div className="mt-4 space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted">No active repairs. When you Fix It, tracking lives here.</p>
          ) : (
            jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{job.mechanicProfile.businessName}</p>
                    <p className="text-sm text-muted">{jobAssetLabel(job)} · {job.serviceRequest.problemText}</p>
                  </div>
                  <JobStatusLabel status={job.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-ink">Upcoming maintenance</h2>
        <div className="mt-4 space-y-2">
          {maintenance.length === 0 ? (
            <p className="text-sm text-muted">No due items from your records yet. Pocket Mechanic does not invent a schedule.</p>
          ) : (
            maintenance.slice(0, 6).map((item) => (
              <Link key={item.assetId + item.title} href={`/fix?asset=${item.assetId}&kind=maintenance`} className="block rounded-2xl border border-line bg-card p-4">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="text-sm text-muted">{item.assetLabel} · {item.remainingLabel} · {item.status.replaceAll("_", " ").toLowerCase()}</p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Recent activity</h2>
          <Link className="text-sm font-semibold text-accent" href="/history">History</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {repairs.map((record) => (
            <Link key={record.id} href={`/jobs/${record.jobId}`} className="rounded-2xl border border-line bg-card p-4">
              <p className="font-semibold text-ink">{record.title}</p>
              <p className="text-sm text-muted">{record.job.mechanicProfile.businessName}</p>
              {record.job.outcome ? <p className="mt-1 text-xs text-muted">Outcome: {record.job.outcome.resolved.toLowerCase()}</p> : <p className="mt-1 text-xs text-warning">Did this repair solve the original problem?</p>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
