import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { Badge, Card, EmptyState, KpiCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { formatCents } from "@/lib/money";
import { jobAssetLabel } from "@/lib/asset-display";
import { applyVerificationAction } from "@/app/actions/master";
import { providerAttention } from "@/services/attention";
import { getMechanicCrm } from "@/services/crm";
import { resolveOperatingModel, operatingViews } from "@/lib/operating-model";

export const metadata = { title: "What needs my attention?" };

export default async function MechanicDashboardPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUnique({ where: { userId: session.id } });
  if (!profile) return null;
  const [attention, crm, monthRevenue] = await Promise.all([
    providerAttention(profile.id),
    getMechanicCrm(profile.id, session.id),
    prisma.job.aggregate({
      where: { mechanicProfileId: profile.id, status: "COMPLETED", completedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { totalCents: true },
    }),
  ]);
  const views = operatingViews(resolveOperatingModel(profile));

  return (
    <div>
      <MechanicAppNav current="/mechanic" />
      <h1 className="text-3xl font-bold text-ink">What needs my attention?</h1>
      <p className="mt-1 text-muted">
        {profile.businessName}
        {profile.isFoundingProvider ? ` · Founding Mechanic #${String(profile.foundingNumber).padStart(3, "0")}` : ""}
        {` · ${views.label}`}
      </p>
      {profile.verificationPipeline === "NOT_STARTED" || profile.verificationLevel === "UNVERIFIED" ? (
        <Card className="mt-4 p-4">
          <p className="font-medium text-ink">Become Pocket Mechanic Verified</p>
          <p className="mt-1 text-sm text-muted">Apply for an in-person evaluation. Verification cannot be purchased.</p>
          <form action={applyVerificationAction} className="mt-3">
            <input type="hidden" name="kind" value={profile.serviceMode === "SHOP" ? "SHOP" : "MOBILE"} />
            <Button size="sm">Apply for verification</Button>
          </form>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="New requests" value={attention.requests} />
        <KpiCard label="Estimates waiting" value={attention.awaiting} />
        <KpiCard label="Ready" value={attention.ready} />
        <KpiCard label="This month" value={formatCents(monthRevenue._sum.totalCents ?? 0)} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">Queue</h2>
        <div className="mt-3 space-y-2">
          {attention.items.length === 0 ? (
            <EmptyState title="Queue is clear" body="New requests, waiting estimates, and recommended-work follow-ups will land here." />
          ) : (
            attention.items.map((item) =>
              item ? (
                <Link key={item.href + item.label} href={item.href} className="block">
                  <Card className="flex items-center justify-between p-4">
                    <p className="text-sm text-ink">{item.label}</p>
                    <Badge tone={item.tone === "danger" ? "danger" : item.tone === "warning" ? "warning" : item.tone === "success" ? "success" : "accent"}>Open</Badge>
                  </Card>
                </Link>
              ) : null,
            )
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Today</h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/mechanic/schedule">Open schedule</Link>
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {attention.today.length === 0 ? (
            <p className="text-sm text-muted">Nothing on the calendar today. Unscheduled work is on the operating board.</p>
          ) : (
            attention.today.map((job) => (
              <Link key={job.id} href={`/mechanic/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{jobAssetLabel(job)}</p>
                    <p className="text-sm text-muted">
                      {job.customer.firstName} {job.customer.lastName} · {job.serviceRequest.problemText}
                    </p>
                  </div>
                  <div className="text-right">
                    <JobStatusLabel status={job.status} />
                    <p className="mt-1 text-xs text-muted">{job.scheduledAt ? job.scheduledAt.toLocaleTimeString() : "Unscheduled"}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">My list</h2>
          <Link className="text-sm font-semibold text-accent" href="/mechanic/customers/today">
            CRM today
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted">
          {crm.attention.recommended} recommended · {formatCents(crm.attention.potential)} declined work · {crm.attention.unpaid} unpaid
        </p>
        <div className="mt-4 space-y-2">
          {crm.recommended.slice(0, 5).map((item) => (
            <Link key={item.id} href={`/mechanic/customers/${item.customerId}`} className="block rounded-2xl border border-line bg-card p-4 text-sm">
              {item.title} · {item.customer.firstName} {item.customer.lastName}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
