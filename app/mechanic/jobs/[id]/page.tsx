import { notFound } from "next/navigation";
import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { StatusTimeline } from "@/components/jobs/status-timeline";
import { EstimateCard } from "@/components/jobs/estimate-card";
import { RepairGroupEstimate } from "@/components/jobs/repair-group-estimate";
import { GroupedEstimateBuilder } from "@/components/jobs/grouped-estimate-builder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createEstimateAction, saveRepairRecordAction, sendMessageAction, updateJobStatusAction } from "@/app/actions/marketplace";
import { addInspectionFindingAction, findingToEstimateGroupAction } from "@/app/actions/master";
import { AppointmentCard } from "@/components/jobs/appointment-card";
import { JobPhotoGallery } from "@/components/jobs/job-photos";
import { requireSession } from "@/lib/guards";
import { getJobForUser } from "@/services/jobs";
import { ALLOWED_JOB_TRANSITIONS } from "@/services/mechanics";
import { formatCents } from "@/lib/money";
import { jobAssetLabel, jobUsageLabel } from "@/lib/asset-display";
import { INSPECTION_TEMPLATES } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const metadata = { title: "Job" };

const TABS = ["overview", "messages", "inspection", "estimate", "repair", "payment", "history"] as const;
const INSPECTION_SECTIONS = [
  "Engine",
  "Brakes",
  "Suspension",
  "Steering",
  "Tires",
  "Battery",
  "Fluids",
  "Leaks",
  "Transmission",
  "Cooling",
  "Lighting",
  "Belts/Hoses",
  "Other",
];

export default async function MechanicJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = TABS.includes(rawTab as (typeof TABS)[number]) ? (rawTab as (typeof TABS)[number]) : "overview";
  const job = await getJobForUser(id, session.id, session.role);
  if (!job) notFound();
  const nextStatuses = ALLOWED_JOB_TRANSITIONS[job.status];
  const findings = job.inspections.flatMap((inspection) => inspection.findings);
  const href = (value: string) => `/mechanic/jobs/${job.id}?tab=${value}`;
  const industryKey = job.asset?.industry.key ?? "AUTOMOTIVE";
  const inspectionSections =
    INSPECTION_TEMPLATES.find((item) => item.industry === industryKey)?.sections ?? INSPECTION_SECTIONS;
  const primaryId =
    job.asset?.identifiers.find((item) => ["VIN", "HIN", "SERIAL_NUMBER"].includes(item.kind))?.value ??
    job.vehicle?.vin;

  return (
    <div>
      <MechanicAppNav current="/mechanic/jobs" />
      <p className="text-sm text-muted">
        {job.customer.firstName} {job.customer.lastName} · {jobAssetLabel(job)}
      </p>
      <h1 className="text-3xl font-bold text-ink">{job.serviceRequest.problemText}</h1>
      <div className="mt-6 flex gap-2 overflow-x-auto text-sm">
        {TABS.map((value) => (
          <Link
            key={value}
            href={href(value)}
            className={cn(
              "rounded-full px-3 py-1.5 capitalize",
              tab === value ? "bg-accent text-white" : "bg-slate text-muted",
            )}
          >
            {value}
          </Link>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Job status</h2>
            <div className="mt-4">
              <StatusTimeline status={job.status} />
            </div>
            {nextStatuses.length ? (
              <form action={updateJobStatusAction} className="mt-4 flex gap-2">
                <input type="hidden" name="jobId" value={job.id} />
                <Select name="status" defaultValue={nextStatuses[0]}>
                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
                <Button type="submit">Update</Button>
              </form>
            ) : null}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Customer concern</h2>
            <p className="mt-2 text-sm">{job.serviceRequest.description || job.serviceRequest.problemText}</p>
            {job.serviceRequest.whenItHappens ? (
              <p className="mt-2 text-sm text-muted">When: {job.serviceRequest.whenItHappens}</p>
            ) : null}
            {job.serviceRequest.summary ? <p className="mt-2 text-sm text-muted">{job.serviceRequest.summary}</p> : null}
            <p className="mt-3 text-sm text-muted">
              {primaryId ? `${primaryId} · ` : ""}
              {jobUsageLabel(job) || (job.vehicle ? `${job.vehicle.mileage.toLocaleString()} miles` : "")}
              {job.vehicle?.engine ? ` · ${job.vehicle.engine}` : ""}
            </p>
            <p className="mt-1 text-sm text-muted">
              {job.serviceRequest.mobilePreferred ? "Mobile service" : "Shop"} · {job.serviceRequest.zip}
            </p>
          </Card>
          <AppointmentCard
            jobId={job.id}
            scheduledAt={job.scheduledAt}
            confirmedAt={job.scheduledConfirmedAt}
            canPropose={job.status !== "COMPLETED" && job.status !== "CANCELLED"}
          />
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Approved scope</h2>
            {job.authorizations[0] ? (
              <p className="mt-2 number text-xl font-semibold">{formatCents(job.authorizations[0].authorizedCents)}</p>
            ) : (
              <p className="mt-2 text-sm text-muted">No authorization submitted yet.</p>
            )}
            <ul className="mt-3 space-y-1 text-sm">
              {job.repairGroups
                .filter((group) => group.status === "APPROVED")
                .map((group) => (
                  <li key={group.id}>
                    {group.title} · {formatCents(group.totalCents)}
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      ) : null}

      {tab === "messages" && job.thread ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">Message customer</h2>
          <div className="mt-3 space-y-2">
            {job.thread.messages.map((message) => (
              <p key={message.id} className="text-sm">
                <span className="font-medium">{message.sender.firstName}:</span> {message.body}
              </p>
            ))}
          </div>
          <form action={sendMessageAction} className="mt-3 flex gap-2">
            <input type="hidden" name="threadId" value={job.thread.id} />
            <Input name="body" />
            <Button type="submit">Send</Button>
          </form>
        </Card>
      ) : null}

      {tab === "inspection" ? (
        <div className="mt-6 space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Digital inspection</h2>
            <p className="mt-1 text-sm text-muted">Findings can convert directly into an estimate repair group.</p>
            <form action={addInspectionFindingAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="jobId" value={job.id} />
              <Select name="section" defaultValue="Brakes">
                {inspectionSections.map((section) => (
                  <option key={section}>{section}</option>
                ))}
              </Select>
              <Select name="status" defaultValue="NEEDS_ATTENTION">
                <option value="GOOD">Good</option>
                <option value="MONITOR">Monitor</option>
                <option value="NEEDS_ATTENTION">Needs attention</option>
              </Select>
              <Textarea name="explanation" placeholder="What you found" className="md:col-span-2" />
              <Input name="recommendation" placeholder="Recommended repair" className="md:col-span-2" />
              <Button type="submit">Save finding</Button>
            </form>
          </Card>
          {findings.map((finding) => (
            <Card key={finding.id} className="p-5">
              <p className="font-semibold text-ink">
                {finding.section} · {finding.status.replaceAll("_", " ").toLowerCase()}
              </p>
              <p className="mt-1 text-sm text-muted">{finding.explanation}</p>
              {finding.status !== "GOOD" ? (
                <form action={findingToEstimateGroupAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="jobId" value={job.id} />
                  <Input name="title" defaultValue={finding.recommendation || `${finding.section} service`} />
                  <Input name="amount" placeholder="Amount" />
                  <Button size="sm" type="submit">
                    Add to estimate
                  </Button>
                </form>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "estimate" ? (
        <div className="mt-6 space-y-4">
          {job.estimates.map((estimate) =>
            estimate.repairGroups?.length ? (
              <RepairGroupEstimate
                key={estimate.id}
                estimateId={estimate.id}
                jobId={job.id}
                groups={estimate.repairGroups}
                supplemental={estimate.type === "CHANGE_ORDER"}
              />
            ) : (
              <EstimateCard key={estimate.id} estimate={estimate} />
            ),
          )}
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Send grouped estimate</h2>
            <p className="text-sm text-muted">Each repair group is authorized separately. Additional work must be a supplemental estimate.</p>
            <div className="mt-4">
              <GroupedEstimateBuilder
                jobId={job.id}
                defaultType={job.authorizations.length ? "CHANGE_ORDER" : "PRIMARY"}
                lockedSupplemental={job.authorizations.length > 0}
              />
            </div>
          </Card>
          <details className="rounded-2xl border border-line bg-card p-5">
            <summary className="cursor-pointer text-sm font-semibold text-muted">Advanced: line-item estimate without repair groups</summary>
            <p className="mt-2 text-xs text-muted">Customers authorize by repair group. Use this only if you need a preliminary total that is not the authorization path.</p>
            <form action={createEstimateAction} className="mt-4 space-y-3">
              <input type="hidden" name="jobId" value={job.id} />
              <Select name="type" defaultValue={job.authorizations.length ? "CHANGE_ORDER" : "PRIMARY"}>
                <option value="PRELIMINARY">Preliminary estimate</option>
                <option value="PRIMARY">Estimate</option>
                <option value="CHANGE_ORDER">Supplemental estimate</option>
              </Select>
              <Textarea name="reason" placeholder="During inspection we found..." />
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid gap-2 md:grid-cols-4">
                  <Select name="itemCategory" defaultValue={index === 0 ? "DIAGNOSTIC" : index === 1 ? "PARTS" : "LABOR"}>
                    <option>DIAGNOSTIC</option>
                    <option>PARTS</option>
                    <option>LABOR</option>
                    <option>SUPPLIES</option>
                    <option>OTHER</option>
                  </Select>
                  <Input name="itemDescription" placeholder={index === 0 ? "Diagnostic labor" : "Description"} defaultValue={index === 0 ? "Diagnostic labor" : ""} />
                  <Input name="itemQuantity" defaultValue="1" />
                  <Input name="itemUnit" placeholder="95" defaultValue={index === 0 ? "95" : ""} />
                </div>
              ))}
              <Button type="submit">Send to customer</Button>
            </form>
          </details>
        </div>
      ) : null}

      {tab === "repair" ? (
        <div className="mt-6 space-y-4">
          <JobPhotoGallery photos={job.photos} jobId={job.id} canUpload />
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Repair documentation</h2>
            <form action={saveRepairRecordAction} className="mt-4 space-y-3">
              <input type="hidden" name="jobId" value={job.id} />
              <Field label="What was done">
                <Input name="title" required defaultValue={job.repairRecord?.title ?? ""} placeholder="Front wheel bearing replacement" />
              </Field>
              <Field label="Diagnosis">
                <Textarea name="diagnosis" defaultValue={job.repairRecord?.diagnosis ?? ""} />
              </Field>
              <Field label="Parts replaced">
                <Input name="partsReplaced" defaultValue={job.repairRecord?.partsReplaced ?? ""} />
              </Field>
              <Field label="Part numbers">
                <Input name="partNumbers" defaultValue={job.repairRecord?.partNumbers ?? ""} />
              </Field>
              <Field label="Labor hours">
                <Input name="laborHours" defaultValue={job.repairRecord?.laborHours ?? ""} />
              </Field>
              <Field label="Mileage">
                <Input name="mileage" defaultValue={job.repairRecord?.mileage ?? job.vehicle?.mileage ?? job.asset?.usageValue ?? ""} />
              </Field>
              <Field label="Warranty">
                <Input name="warrantySummary" defaultValue={job.repairRecord?.warrantySummary ?? "12 months / 12,000 miles"} />
              </Field>
              <Button type="submit">Save repair record</Button>
            </form>
          </Card>
        </div>
      ) : null}

      {tab === "payment" ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">Payment</h2>
          <p className="mt-2 text-sm capitalize">{job.paymentStatus.toLowerCase()}</p>
          <p className="number mt-1 text-xl font-semibold text-ink">{formatCents(job.totalCents)}</p>
          {job.payments.map((payment) => (
            <p key={payment.id} className="mt-2 text-sm text-muted">
              {formatCents(payment.amountCents)} · fee {formatCents(payment.commissionCents)} · payout {formatCents(payment.mechanicPayoutCents)}
            </p>
          ))}
        </Card>
      ) : null}

      {tab === "history" ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">Event timeline</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {job.events.map((event) => (
              <li key={event.id}>
                {event.createdAt.toLocaleString()} · {event.status.replaceAll("_", " ")}
                {event.note ? ` — ${event.note}` : ""}
              </li>
            ))}
          </ul>
          {job.authorizations.map((auth) => (
            <p key={auth.id} className="mt-3 text-sm">
              Authorization {auth.submittedAt.toLocaleString()} · authorized {formatCents(auth.authorizedCents)} of {formatCents(auth.originalCents)}
            </p>
          ))}
        </Card>
      ) : null}
    </div>
  );
}
