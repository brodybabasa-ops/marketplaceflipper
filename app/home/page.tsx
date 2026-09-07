import Link from "next/link";
import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { VehicleCard } from "@/components/jobs/vehicle-card";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Home" };

export default async function CustomerHomePage() {
  const session = await requireSession("CUSTOMER");
  const [vehicles, jobs, threads, repairs, saved, upcoming, unpaid] = await Promise.all([
    prisma.vehicle.findMany({
      where: { customerId: session.id },
      include: { make: true, model: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.findMany({
      where: { customerId: session.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.messageThread.count({ where: { customerId: session.id } }),
    prisma.repairRecord.findMany({
      where: { vehicle: { customerId: session.id } },
      include: { job: { include: { mechanicProfile: true } }, vehicle: { include: { make: true, model: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.savedMechanic.findMany({
      where: { customerId: session.id },
      include: { mechanic: true },
      take: 4,
    }),
    prisma.job.findMany({
      where: { customerId: session.id, scheduledAt: { gte: new Date() }, status: { notIn: ["CANCELLED", "COMPLETED"] } },
      include: { mechanicProfile: true },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    }),
    prisma.job.findMany({
      where: { customerId: session.id, status: "COMPLETED", paymentStatus: { not: "PAID" }, totalCents: { gt: 0 } },
      include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } } },
      orderBy: { completedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AppNav items={CUSTOMER_NAV} current="/home" />
      <h1 className="text-3xl font-bold text-ink">How can we help with your vehicle?</h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/request">Find a Mechanic</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/vehicles">My Vehicles</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/jobs">My Jobs</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/messages">Messages</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/history">Repair History</Link>
        </Button>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-ink">My vehicles</h2>
        {vehicles.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Add your first vehicle" body="Year, make, and model is enough. We’ll keep the rest of the details simple.">
              <Button asChild>
                <Link href="/vehicles/new">Add a vehicle</Link>
              </Button>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={{
                  id: vehicle.id,
                  year: vehicle.year,
                  make: vehicle.make.name,
                  model: vehicle.model.name,
                  mileage: vehicle.mileage,
                  nickname: vehicle.nickname,
                }}
                ctaHref={`/request?vehicle=${vehicle.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">Active jobs</p>
          <p className="number mt-1 text-3xl font-bold text-ink">{jobs.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Upcoming appointments</p>
          <p className="number mt-1 text-3xl font-bold text-ink">{upcoming.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Messages</p>
          <p className="number mt-1 text-3xl font-bold text-ink">{threads}</p>
        </Card>
      </section>

      {unpaid.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Pay for completed work</h2>
          <div className="mt-4 space-y-3">
            {unpaid.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}/pay`} className="block rounded-2xl border border-line bg-card p-4">
                <p className="font-semibold text-ink">{job.mechanicProfile.businessName}</p>
                <p className="text-sm text-muted">
                  {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                </p>
                <p className="number mt-1 font-semibold text-accent">Pay {formatCents(job.totalCents)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-ink">Upcoming appointments</h2>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Nothing on the calendar yet.</p>
          ) : (
            upcoming.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
                <p className="font-semibold text-ink">{job.mechanicProfile.businessName}</p>
                <p className="text-sm text-muted">{job.scheduledAt?.toLocaleString()}</p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-ink">Active jobs</h2>
        <div className="mt-4 space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted">No active jobs yet.</p>
          ) : (
            jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{job.mechanicProfile.businessName}</p>
                    <p className="text-sm text-muted">
                      {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                    </p>
                  </div>
                  <JobStatusLabel status={job.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Recent repairs</h2>
          <Link className="text-sm font-semibold text-accent" href="/history">
            Full history
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {repairs.map((record) => (
            <Link key={record.id} href={`/jobs/${record.jobId}`} className="rounded-2xl border border-line bg-card p-4">
              <p className="font-semibold text-ink">{record.title}</p>
              <p className="text-sm text-muted">{record.job.mechanicProfile.businessName}</p>
              <p className="number mt-1 text-sm font-semibold">{formatCents(record.job.totalCents)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Saved mechanics</h2>
          <Link className="text-sm font-semibold text-accent" href="/saved">
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {saved.length === 0 ? (
            <p className="text-sm text-muted">Save a mechanic from their profile when you want them later.</p>
          ) : (
            saved.map((item) => (
              <Link key={item.id} href={`/mechanics/${item.mechanic.slug}`} className="rounded-2xl border border-line bg-card p-4">
                <p className="font-semibold text-ink">{item.mechanic.businessName}</p>
                <p className="text-sm text-muted">{item.mechanic.shopCity}, {item.mechanic.shopState}</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
