import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveDisputeAction } from "@/app/actions/admin";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Disputes" };

export default async function AdminDisputesPage() {
  await requireSession("ADMIN");
  const disputes = await prisma.dispute.findMany({
    include: { customer: true, mechanic: true, job: { include: { serviceRequest: true, estimates: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold text-navy">Disputes</h1>
      <div className="mt-6 space-y-4">
        {disputes.map((dispute) => (
          <div key={dispute.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold text-navy">
              {dispute.category.replaceAll("_", " ")} · {dispute.status}
            </p>
            <p className="text-sm">{dispute.description}</p>
            <p className="mt-2 text-xs text-muted">
              {dispute.customer.email} vs {dispute.mechanic.email} · job {dispute.job.serviceRequest.problemText}
            </p>
            {dispute.status !== "RESOLVED" ? (
              <form action={resolveDisputeAction} className="mt-3 flex gap-2">
                <input type="hidden" name="disputeId" value={dispute.id} />
                <Input name="resolution" placeholder="Resolution note" />
                <Button size="sm">Resolve</Button>
              </form>
            ) : (
              <p className="mt-2 text-sm text-success">{dispute.resolution}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
