import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoardRow } from "@/components/layout/themed-board";
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
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <BoardRow key={dispute.id}>
          <p className="font-semibold text-navy">
            {dispute.category.replaceAll("_", " ")} · {dispute.status.replaceAll("_", " ").toLowerCase()}
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
        </BoardRow>
      ))}
    </div>
  );
}
