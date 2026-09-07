import Link from "next/link";
import { notFound } from "next/navigation";
import { KpiCard, Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

export default async function HqCustomer360({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(staffRoles());
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      vehicles: { include: { make: true, model: true } },
      jobsAsCustomer: { include: { mechanicProfile: true, serviceRequest: true }, orderBy: { createdAt: "desc" } },
      disputesOpened: true,
    },
  });
  if (!customer || customer.role !== "CUSTOMER") notFound();
  const spend = customer.jobsAsCustomer.filter((job) => job.status === "COMPLETED").reduce((sum, job) => sum + job.totalCents, 0);
  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-accent">
        Back to customers
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-ink">
        {customer.firstName} {customer.lastName}
      </h1>
      <p className="text-sm text-muted">{customer.email}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <KpiCard label="Vehicles" value={customer.vehicles.length} />
        <KpiCard label="Jobs" value={customer.jobsAsCustomer.length} />
        <KpiCard label="Lifetime spend" value={formatCents(spend)} />
        <KpiCard label="Assurance claims" value={customer.disputesOpened.length} />
      </div>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Vehicles</h2>
          {customer.vehicles.map((vehicle) => (
            <p key={vehicle.id} className="mt-2 text-sm">
              {vehicle.year} {vehicle.make.name} {vehicle.model.name}
              {vehicle.vin ? ` · ${vehicle.vin}` : ""}
            </p>
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Jobs</h2>
          {customer.jobsAsCustomer.slice(0, 8).map((job) => (
            <Link key={job.id} href={`/admin/jobs`} className="mt-2 block text-sm">
              {job.serviceRequest.problemText} · {job.mechanicProfile.businessName} · {job.status.toLowerCase()}
            </Link>
          ))}
        </Card>
      </section>
    </div>
  );
}
