import { formatCents } from "@/lib/money";
import { estimateStatusClass, estimateStatusLabel } from "@/lib/estimates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { estimateDecisionAction } from "@/app/actions/marketplace";
import type { ApprovalAction, EstimateLineCategory, EstimateStatus, EstimateType } from "@prisma/client";

type Line = { id: string; category: EstimateLineCategory; description: string; quantity: number; unitCents: number; totalCents: number };
type Approval = { id: string; action: ApprovalAction; createdAt: Date };

export function EstimateDecisionButtons({
  estimateId,
  returnTo,
}: {
  estimateId: string;
  returnTo?: string;
}) {
  return (
    <form action={estimateDecisionAction} className="mt-4 flex flex-wrap gap-2">
      <input type="hidden" name="estimateId" value={estimateId} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <Button type="submit" name="action" value="APPROVED">
        Approve Estimate
      </Button>
      <Button type="submit" name="action" value="DECLINED" variant="secondary">
        Decline
      </Button>
    </form>
  );
}

export function EstimateCard({
  estimate,
  canApprove,
  audience = "customer",
  returnTo,
  highlight,
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
  audience?: "customer" | "shop";
  returnTo?: string;
  highlight?: boolean;
}) {
  const title = estimate.type === "CHANGE_ORDER" ? "Additional work request" : "Estimate";
  const pending = canApprove && estimate.status === "SENT";
  return (
    <Card
      id={pending || highlight ? "estimate" : `estimate-${estimate.id}`}
      className="border-0 p-5 shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-navy">{title}</h3>
          <p className={`text-sm font-semibold ${estimateStatusClass(estimate.status)}`}>
            {estimateStatusLabel(estimate.status, audience)}
          </p>
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
          {approval.action === "APPROVED" ? "Approved" : "Declined"} {approval.createdAt.toLocaleString()}
        </p>
      ))}
      {pending ? <EstimateDecisionButtons estimateId={estimate.id} returnTo={returnTo} /> : null}
    </Card>
  );
}
