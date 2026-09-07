import Link from "next/link";
import { HqAppNav } from "@/components/layout/app-nav";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

export const metadata = { title: "HQ customers" };

export default async function HqCustomersPage() {
  await requireSession(staffRoles());
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { vehicles: true, jobsAsCustomer: { select: { totalCents: true, status: true } } },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <HqAppNav current="/admin/customers" />
      <h1 className="text-3xl font-bold text-ink">Customers</h1>
      <table className="mt-6 min-w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-2">Customer</th>
            <th>Vehicles</th>
            <th>Spend</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((item) => (
            <tr key={item.id} className="border-t border-line">
              <td className="py-3">
                <Link href={`/admin/customers/${item.id}`} className="font-semibold text-ink">
                  {item.firstName} {item.lastName}
                </Link>
                <p className="text-xs text-muted">{item.email}</p>
              </td>
              <td>{item.vehicles.length}</td>
              <td className="number">
                {formatCents(item.jobsAsCustomer.filter((job) => job.status === "COMPLETED").reduce((sum, job) => sum + job.totalCents, 0))}
              </td>
              <td className="capitalize">{item.status.toLowerCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
