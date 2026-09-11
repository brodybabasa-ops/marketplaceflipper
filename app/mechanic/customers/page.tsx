import { BoardRow } from "@/components/layout/themed-board";
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
    <ul className="space-y-3">
      {jobs.map((job) => (
        <li key={job.customerId}>
          <BoardRow>
            <p className="font-semibold text-navy">
              {job.customer.firstName} {job.customer.lastName}
            </p>
          </BoardRow>
        </li>
      ))}
    </ul>
  );
}
