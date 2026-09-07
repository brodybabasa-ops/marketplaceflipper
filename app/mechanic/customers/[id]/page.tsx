import Link from "next/link";
import { notFound } from "next/navigation";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { Card, KpiCard } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { jobAssetLabel } from "@/lib/asset-display";

export default async function MechanicCustomer360({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("MECHANIC");
  const { id } = await params;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const customer = await prisma.user.findUnique({ where: { id } });
  if (!customer) notFound();
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id, customerId: id },
    include: { vehicle: { include: { make: true, model: true } }, asset: true, serviceRequest: true },
    orderBy: { createdAt: "desc" },
  });
  const recommended = await prisma.recommendedWork.findMany({
    where: { mechanicProfileId: profile.id, customerId: id, status: "OPEN" },
  });
  const completed = jobs.filter((job) => job.status === "COMPLETED");
  const spend = completed.reduce((sum, job) => sum + job.totalCents, 0);
  return (
    <div>
      <MechanicAppNav current="/mechanic/customers" />
      <Link href="/mechanic/customers" className="text-sm text-accent">
        Back to customers
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-ink">
        {customer.firstName} {customer.lastName}
      </h1>
      <p className="text-sm text-muted">
        {customer.email} {customer.phone ? `· ${customer.phone}` : ""}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Lifetime spend" value={formatCents(spend)} />
        <KpiCard label="Completed jobs" value={completed.length} />
        <KpiCard label="Average RO" value={formatCents(completed.length ? Math.round(spend / completed.length) : 0)} />
        <KpiCard label="Recommended" value={recommended.length} />
      </div>
      {recommended[0] ? (
        <Card className="mt-6 border-warning/40 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-warning">Next action</p>
          <p className="mt-2 text-xl font-bold text-ink">{recommended[0].title}</p>
          <p className="text-sm text-muted">{formatCents(recommended[0].estimatedCents)}</p>
        </Card>
      ) : null}
      <section className="mt-8">
        <h2 className="font-semibold text-ink">Jobs</h2>
        <div className="mt-3 space-y-2">
          {jobs.map((job) => (
            <Link key={job.id} href={`/mechanic/jobs/${job.id}`} className="block rounded-xl border border-line bg-card p-4">
              <p className="font-medium text-ink">{job.serviceRequest.problemText}</p>
              <p className="text-sm text-muted">
                {jobAssetLabel(job)} · {job.status.toLowerCase()}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
