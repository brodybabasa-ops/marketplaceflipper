import { decideGroupAction, submitAuthorizationAction } from "@/app/actions/master";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { totalsForGroups } from "@/services/repair-groups";
import type { GroupAuthStatus } from "@prisma/client";

type Group = {
  id: string;
  title: string;
  recommendation: string;
  status: GroupAuthStatus;
  totalCents: number;
  lineItems: { id: string; description: string; totalCents: number; category: string }[];
};

export function RepairGroupEstimate({
  estimateId,
  jobId,
  groups,
  canDecide,
  supplemental,
}: {
  estimateId: string;
  jobId: string;
  groups: Group[];
  canDecide?: boolean;
  supplemental?: boolean;
}) {
  const totals = totalsForGroups(groups);
  return (
    <Card className="p-5">
      <h3 className="font-semibold text-ink">{supplemental ? "Supplemental estimate" : "Choose the repairs you'd like us to complete"}</h3>
      <p className="mt-1 text-sm text-muted">Each repair is authorized separately. Approved work cannot be silently changed.</p>
      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-xl border border-line bg-navy p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{group.title}</p>
                <p className="text-xs uppercase tracking-wide text-muted">{group.recommendation.toLowerCase()}</p>
              </div>
              <p className="number text-xl font-bold text-ink">{formatCents(group.totalCents)}</p>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {group.lineItems.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.description}</span>
                  <span className="number">{formatCents(item.totalCents)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-semibold uppercase text-accent">{group.status.toLowerCase()}</p>
            {canDecide && group.status === "PENDING" ? (
              <div className="mt-3 flex gap-2">
                <form action={decideGroupAction}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="jobId" value={jobId} />
                  <input type="hidden" name="action" value="APPROVED" />
                  <Button size="sm" variant="success">
                    Approve
                  </Button>
                </form>
                <form action={decideGroupAction}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="jobId" value={jobId} />
                  <input type="hidden" name="action" value="DECLINED" />
                  <Button size="sm" variant="danger">
                    Decline
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between text-muted">
          <dt>Original</dt>
          <dd className="number">{formatCents(totals.originalCents)}</dd>
        </div>
        <div className="flex justify-between text-success">
          <dt>Approved repairs</dt>
          <dd className="number">{formatCents(totals.approvedCents)}</dd>
        </div>
        <div className="flex justify-between text-danger">
          <dt>Declined repairs</dt>
          <dd className="number">{formatCents(totals.declinedCents)}</dd>
        </div>
        <div className="flex justify-between text-warning">
          <dt>Pending</dt>
          <dd className="number">{formatCents(totals.pendingCents)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold text-ink">
          <dt>Amount authorized</dt>
          <dd className="number">{formatCents(totals.authorizedCents)}</dd>
        </div>
      </dl>
      {canDecide && totals.pendingCents === 0 && groups.length ? (
        <form action={submitAuthorizationAction} className="mt-4">
          <input type="hidden" name="estimateId" value={estimateId} />
          <input type="hidden" name="jobId" value={jobId} />
          <Button type="submit">Submit authorization</Button>
        </form>
      ) : null}
    </Card>
  );
}
