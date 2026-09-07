import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { hqVerificationAction, saveChecklistItemAction } from "@/app/actions/master";
import { requireSession } from "@/lib/guards";
import { staffRoles, can } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export default async function VerificationApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(staffRoles());
  const { id } = await params;
  const application = await prisma.verificationApplication.findUnique({
    where: { id },
    include: {
      mechanic: { include: { user: true } },
      events: { orderBy: { createdAt: "asc" } },
      inspections: { include: { items: true, inspector: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!application) notFound();
  const inspection = application.inspections[0];
  const canDecide = can(session.role, "verification.decide") || session.role === "ADMIN";
  const canInspect = can(session.role, "verification.inspect") || session.role === "ADMIN";
  return (
    <div>
      <Link href="/admin/verification" className="text-sm text-accent">
        Back to Verification Center
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-ink">{application.mechanic.businessName}</h1>
      <p className="text-sm text-muted">
        {application.kind} inspection · {application.status.replaceAll("_", " ")} · {application.mechanic.user.email}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Pipeline</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {application.events.map((event) => (
              <li key={event.id}>
                {event.createdAt.toLocaleString()} · {event.toStatus.replaceAll("_", " ")}
                {event.reason ? ` — ${event.reason}` : ""}
              </li>
            ))}
          </ul>
          {canInspect || canDecide ? (
            <form action={hqVerificationAction} className="mt-4 space-y-2">
              <input type="hidden" name="applicationId" value={application.id} />
              <Select name="status" defaultValue={application.status}>
                <option value="VISIT_SCHEDULED">Schedule visit</option>
                <option value="EVALUATION_COMPLETED">Complete evaluation</option>
                <option value="ADDITIONAL_ACTION">Request corrective action</option>
                {canDecide ? <option value="VERIFIED">Approve Verified</option> : null}
                {canDecide ? <option value="DENIED">Deny</option> : null}
              </Select>
              <Input name="reason" placeholder="Internal reason" />
              <Button type="submit">Save status</Button>
            </form>
          ) : null}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Provider</h2>
          <p className="mt-2 text-sm">{application.mechanic.bio}</p>
          <p className="mt-2 text-sm text-muted">
            {application.mechanic.shopCity}, {application.mechanic.shopState} · {application.mechanic.serviceMode}
          </p>
        </Card>
      </div>
      {inspection ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Inspection checklist</h2>
          <p className="text-sm text-muted">Private HQ scoring. Mechanics never see these notes.</p>
          <div className="mt-4 space-y-3">
            {inspection.items.map((item) => (
              <Card key={item.id} className="p-4">
                <form action={saveChecklistItemAction} className="grid gap-2 md:grid-cols-4">
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="applicationId" value={application.id} />
                  <p className="font-medium md:col-span-4">{item.category}</p>
                  <Input name="score" defaultValue={item.score ?? ""} placeholder="Score" />
                  <Select name="passed" defaultValue={item.passed == null ? "" : String(item.passed)}>
                    <option value="">No result</option>
                    <option value="true">Pass</option>
                    <option value="false">Fail</option>
                  </Select>
                  <Input name="notes" defaultValue={item.notes ?? ""} placeholder="Internal notes" className="md:col-span-2" />
                  {canInspect ? (
                    <Button size="sm" type="submit">
                      Save item
                    </Button>
                  ) : null}
                </form>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-6 text-sm text-muted">Schedule a visit to generate the {application.kind.toLowerCase()} checklist.</p>
      )}
    </div>
  );
}
