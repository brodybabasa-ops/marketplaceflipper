import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Customers" };

export default async function MechanicCustomersPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id },
    include: { customer: true },
    distinct: ["customerId"],
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <AppNav items={MECHANIC_NAV} current="/mechanic/customers" />
      <h1 className="text-3xl font-bold text-navy">Customers</h1>
      <ul className="mt-6 space-y-3">
        {jobs.map((job) => (
          <li key={job.customerId} className="rounded-2xl border border-line bg-white p-4">
            {job.customer.firstName} {job.customer.lastName}
          </li>
        ))}
      </ul>
    </div>
  );
}
