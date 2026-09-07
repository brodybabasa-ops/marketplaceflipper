import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Pocket Assurance" };

export default async function MechanicAssurancePage() {
  const session = await requireSession("MECHANIC");
  const disputes = await prisma.dispute.findMany({
    where: { mechanicId: session.id },
    include: { customer: true, job: { include: { serviceRequest: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <MechanicAppNav current="/mechanic/assurance" />
      <h1 className="text-3xl font-bold text-ink">Pocket Assurance</h1>
      <p className="mt-2 text-sm text-muted">Dispute workflow for Pocket Mechanic jobs. This is not insurance.</p>
      <div className="mt-6 space-y-3">
        {disputes.length === 0 ? <p className="text-muted">No open or past claims.</p> : null}
        {disputes.map((dispute) => (
          <Link key={dispute.id} href={`/mechanic/jobs/${dispute.jobId}`} className="block rounded-2xl border border-line bg-card p-4">
            <p className="font-semibold text-ink">
              {dispute.category.replaceAll("_", " ")} · {dispute.status}
            </p>
            <p className="text-sm text-muted">
              {dispute.customer.firstName} · {dispute.job.serviceRequest.problemText}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
