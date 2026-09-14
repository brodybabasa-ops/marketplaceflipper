import { ShopCustomersView } from "@/components/shop-os/list-pages";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatAppointment } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function MechanicCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { q } = await searchParams;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id },
    include: { customer: true, serviceRequest: true },
    orderBy: { updatedAt: "desc" },
  });
  const byCustomer = new Map<string, { job: (typeof jobs)[number]; count: number }>();
  for (const job of jobs) {
    const current = byCustomer.get(job.customerId);
    if (current) current.count += 1;
    else byCustomer.set(job.customerId, { job, count: 1 });
  }
  const term = q?.trim().toLowerCase();
  const customers = [...byCustomer.values()]
    .map(({ job, count }) => ({
      id: job.customerId,
      firstName: job.customer.firstName,
      lastName: job.customer.lastName,
      email: job.customer.email,
      phone: job.customer.phone,
      jobCount: count,
      lastJob: job.scheduledAt ? formatAppointment(job.scheduledAt) : job.serviceRequest.problemText,
      href: `/mechanic/jobs?job=${job.id}`,
    }))
    .filter((customer) => {
      if (!term) return true;
      return `${customer.firstName} ${customer.lastName} ${customer.email}`.toLowerCase().includes(term);
    });
  return <ShopCustomersView customers={customers} q={q} />;
}
