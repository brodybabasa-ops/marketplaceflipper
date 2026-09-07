import Link from "next/link";
import { HqAppNav } from "@/components/layout/app-nav";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { hqVerificationAction } from "@/app/actions/master";
import { requireSession } from "@/lib/guards";
import { staffRoles, can } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export const metadata = { title: "Verification Center" };

export default async function AdminVerificationPage() {
  const session = await requireSession(staffRoles());
  const applications = await prisma.verificationApplication.findMany({
    include: {
      mechanic: { include: { user: true } },
      events: { orderBy: { createdAt: "desc" }, take: 4 },
      inspections: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  const canDecide = can(session.role, "verification.decide") || session.role === "ADMIN";
  const canInspect = can(session.role, "verification.inspect") || session.role === "ADMIN";
  return (
    <div>
      <HqAppNav current="/admin/verification" />
      <h1 className="text-3xl font-bold text-ink">Verification Center</h1>
      <p className="mt-2 text-sm text-muted">
        Pocket Mechanic Verified requires an in-person visit. Founding status and advertising cannot purchase this badge.
      </p>
      <div className="mt-6 space-y-3">
        {applications.length === 0 ? <p className="text-muted">No applications yet.</p> : null}
        {applications.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{item.mechanic.businessName}</p>
                <p className="text-sm text-muted">
                  {item.kind.toLowerCase()} · {item.status.replaceAll("_", " ").toLowerCase()}
                </p>
                <Badge tone={item.mechanic.verificationLevel === "POCKET_VERIFIED" ? "accent" : "muted"} className="mt-2">
                  {item.mechanic.verificationLevel === "POCKET_VERIFIED" ? "Pocket Verified" : "Not publicly verified"}
                </Badge>
              </div>
              <Link href={`/admin/verification/${item.id}`} className="text-sm text-accent">
                Open
              </Link>
            </div>
            {canInspect || canDecide ? (
              <form action={hqVerificationAction} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="applicationId" value={item.id} />
                <Select name="status" defaultValue={item.status}>
                  <option value="REVIEWING">Reviewing application</option>
                  <option value="VISIT_SCHEDULING">Visit being scheduled</option>
                  <option value="VISIT_SCHEDULED">Visit scheduled</option>
                  <option value="EVALUATION_COMPLETED">Evaluation completed</option>
                  <option value="ADDITIONAL_ACTION">Additional action required</option>
                  {canDecide ? (
                    <>
                      <option value="VERIFIED">Approve verification</option>
                      <option value="DENIED">Deny</option>
                      <option value="SUSPENDED">Suspend</option>
                      <option value="REVOKED">Revoke</option>
                      <option value="EXPIRED">Expire</option>
                    </>
                  ) : null}
                </Select>
                <Input name="reason" placeholder="Reason / notes (HQ only)" />
                <Button size="sm" type="submit">
                  Update
                </Button>
              </form>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
