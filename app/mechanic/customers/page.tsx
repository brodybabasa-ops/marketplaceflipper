import Link from "next/link";
import { BoardRow } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatAppointment } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function MechanicCustomersPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id },
    include: { customer: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
    orderBy: { updatedAt: "desc" },
  });
  const byCustomer = new Map<string, (typeof jobs)[number]>();
  for (const job of jobs) {
    if (!byCustomer.has(job.customerId)) byCustomer.set(job.customerId, job);
  }
  return (
    <ul className="space-y-3">
      {[...byCustomer.values()].map((job) => (
        <li key={job.customerId}>
          <BoardRow>
            <Link href={`/mechanic/jobs/${job.id}`} className="block">
              <p className="font-semibold text-navy">
                {job.customer.firstName} {job.customer.lastName}
              </p>
              <p className="text-sm text-muted">
                {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name} · {job.serviceRequest.problemText}
                {job.scheduledAt ? ` · ${formatAppointment(job.scheduledAt)}` : ""}
              </p>
            </Link>
          </BoardRow>
        </li>
      ))}
    </ul>
  );
}
