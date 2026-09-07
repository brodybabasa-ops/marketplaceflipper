import Link from "next/link";
import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { VehicleCard } from "@/components/jobs/vehicle-card";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Home" };

export default async function CustomerHomePage() {
  const session = await requireSession("CUSTOMER");
  const [vehicles, jobs, threads, repairs] = await Promise.all([
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
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AppNav items={CUSTOMER_NAV} current="/home" />
      <h1 className="text-3xl font-bold text-navy">How can we help with your vehicle?</h1>
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
        <h2 className="text-xl font-semibold text-navy">My vehicles</h2>
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
          <p className="number mt-1 text-3xl font-bold text-navy">{jobs.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Message threads</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{threads}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Recent repairs</p>
          <p className="number mt-1 text-3xl font-bold text-navy">{repairs.length}</p>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-navy">Active jobs</h2>
        <div className="mt-4 space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted">No active jobs yet.</p>
          ) : (
            jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{job.mechanicProfile.businessName}</p>
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
    </div>
  );
}
