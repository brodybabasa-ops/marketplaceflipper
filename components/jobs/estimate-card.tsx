import { formatCents } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { estimateDecisionAction } from "@/app/actions/marketplace";
import type { ApprovalAction, EstimateLineCategory, EstimateStatus, EstimateType } from "@prisma/client";

type Line = { id: string; category: EstimateLineCategory; description: string; quantity: number; unitCents: number; totalCents: number };
type Approval = { id: string; action: ApprovalAction; createdAt: Date };

export function EstimateCard({
  estimate,
  canApprove,
}: {
  estimate: {
    id: string;
    type: EstimateType;
    status: EstimateStatus;
    reason: string | null;
    totalCents: number;
    lineItems: Line[];
    approvals: Approval[];
    createdAt: Date;
  };
  canApprove?: boolean;
}) {
  const title = estimate.type === "CHANGE_ORDER" ? "Additional work request" : "Estimate";
  return (
        <Card className="border-0 p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-navy">{title}</h3>
          <p className="text-sm text-muted">{estimate.status.toLowerCase()}</p>
        </div>
        <p className="number text-2xl font-semibold text-navy">{formatCents(estimate.totalCents)}</p>
      </div>
      {estimate.reason ? <p className="mt-3 text-sm text-ink">{estimate.reason}</p> : null}
      <ul className="mt-4 divide-y divide-line">
        {estimate.lineItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              {item.quantity} × {item.description}
              <span className="ml-2 text-muted">{item.category.toLowerCase()}</span>
            </span>
            <span className="number font-medium">{formatCents(item.totalCents)}</span>
          </li>
        ))}
      </ul>
      {estimate.approvals.map((approval) => (
        <p key={approval.id} className="mt-3 text-xs text-muted">
          {approval.action} {approval.createdAt.toLocaleString()}
        </p>
      ))}
      {canApprove && estimate.status === "SENT" ? (
        <form action={estimateDecisionAction} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="estimateId" value={estimate.id} />
          <Button name="action" value="APPROVED">
            Approve Estimate
          </Button>
          <Button name="action" value="DECLINED" variant="secondary">
            Decline
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
