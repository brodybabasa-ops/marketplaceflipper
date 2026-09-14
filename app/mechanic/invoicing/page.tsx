import { ShopInvoicingView } from "@/components/shop-os/list-pages";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Invoicing" };

export default async function MechanicInvoicingPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const invoices = await prisma.invoice.findMany({
    where: { job: { mechanicProfileId: profile.id } },
    include: { job: { include: { customer: true } } },
    orderBy: { issuedAt: "desc" },
    take: 40,
  });
  return (
    <ShopInvoicingView
      invoices={invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        totalCents: invoice.totalCents,
        customer: `${invoice.job.customer.firstName} ${invoice.job.customer.lastName}`,
        href: `/mechanic/jobs?job=${invoice.jobId}`,
        issuedAt: invoice.issuedAt,
      }))}
    />
  );
}
