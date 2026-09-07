import Link from "next/link";
import { CustomerAppNav, MechanicAppNav } from "@/components/layout/app-nav";
import { Card, EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Disputes" };

export default async function DisputesPage() {
  const session = await requireSession();
  const disputes = await prisma.dispute.findMany({
    where: session.role === "MECHANIC" ? { mechanicId: session.id } : { customerId: session.id },
    include: { job: { include: { serviceRequest: true, mechanicProfile: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {session.role === "MECHANIC" ? <MechanicAppNav current="/disputes" /> : <CustomerAppNav current="/disputes" />}
      <h1 className="text-3xl font-bold text-ink">Disputes</h1>
      <p className="mt-2 text-sm text-muted">
        A case gathers the job, estimate, approvals, messages, photos, and repair record for admin review.
      </p>
      <div className="mt-6 space-y-3">
        {disputes.length === 0 ? (
          <EmptyState title="No open cases" body="If something goes wrong on a job, report it from the job page." />
        ) : (
          disputes.map((dispute) => (
            <Link key={dispute.id} href={`/jobs/${dispute.jobId}`} className="block">
              <Card className="p-4">
                <p className="font-semibold text-ink">
                  {dispute.category.replaceAll("_", " ")} · {dispute.status.toLowerCase()}
                </p>
                <p className="text-sm text-muted">{dispute.job.mechanicProfile.businessName}</p>
                <p className="mt-2 text-sm">{dispute.description}</p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
