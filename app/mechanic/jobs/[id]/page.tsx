import { notFound } from "next/navigation";
import { StatusTimeline } from "@/components/jobs/status-timeline";
import { EstimateCard } from "@/components/jobs/estimate-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeading } from "@/components/layout/themed-board";
import { createEstimateAction, saveRepairRecordAction, updateJobStatusAction } from "@/app/actions/marketplace";
import { AppointmentCard } from "@/components/jobs/appointment-card";
import { JobPhotos } from "@/components/jobs/job-photos";
import { ThreadView } from "@/components/messages/thread-view";
import { requireSession } from "@/lib/guards";
import { getJobForUser } from "@/services/jobs";
import { ALLOWED_JOB_TRANSITIONS } from "@/services/mechanics";

export const metadata = { title: "Job" };

export default async function MechanicJobPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("MECHANIC");
  const { id } = await params;
  const job = await getJobForUser(id, session.id, session.role);
  if (!job) notFound();
  const nextStatuses = ALLOWED_JOB_TRANSITIONS[job.status];
  return (
    <div>
      <PageHeading
        title={job.serviceRequest.problemText}
        subtitle={`${job.customer.firstName} ${job.customer.lastName} · ${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name} · ${job.serviceRequest.zip}`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 p-5">
          <h2 className="font-semibold text-navy">Job status</h2>
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
          {job.status === "REQUESTED" ? (
            <form action={updateJobStatusAction} className="mt-3">
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="status" value="ACCEPTED" />
              <Button type="submit">Accept this request</Button>
            </form>
          ) : null}
        </Card>
        <Card className="border-0 p-5">
          <h2 className="font-semibold text-navy">Request details</h2>
          <p className="mt-2 text-sm">{job.serviceRequest.description || job.serviceRequest.problemText}</p>
          <p className="mt-2 text-sm text-muted">
            Preferred:{" "}
            {job.serviceRequest.preferredDate
              ? job.serviceRequest.preferredDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "America/Denver",
                })
              : "flexible date"}
            {job.serviceRequest.preferredTimeWindow ? ` · ${job.serviceRequest.preferredTimeWindow}` : ""}
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <AppointmentCard
          jobId={job.id}
          scheduledAt={job.scheduledAt}
          preferredDate={job.serviceRequest.preferredDate}
          preferredTimeWindow={job.serviceRequest.preferredTimeWindow}
          canEdit={job.status !== "COMPLETED" && job.status !== "CANCELLED"}
          surface="shop"
        />
      </div>

      <div className="mt-4">
        <JobPhotos jobId={job.id} photos={job.photos} canUpload surface="shop" />
      </div>

      <section className="mt-8 space-y-4">
        {job.estimates.map((estimate) => (
          <EstimateCard key={estimate.id} estimate={estimate} />
        ))}
        <Card className="border-0 p-5">
          <h2 className="font-semibold text-navy">Create estimate or additional work request</h2>
          <p className="text-sm text-muted">Additional work cannot silently rewrite the original estimate. It creates a new approval record.</p>
          <form action={createEstimateAction} className="mt-4 space-y-3">
            <input type="hidden" name="jobId" value={job.id} />
            <Select name="type" defaultValue="PRIMARY">
              <option value="PRELIMINARY">Preliminary estimate</option>
              <option value="PRIMARY">Estimate</option>
              <option value="CHANGE_ORDER">Additional work request</option>
            </Select>
            <Textarea name="reason" placeholder="During inspection we found..." />
            {[0, 1, 2, 3, 4].map((index) => (
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
                <Input name="itemUnit" placeholder={index === 0 ? "95" : "0"} defaultValue={index === 0 ? "95" : ""} />
              </div>
            ))}
            <Button type="submit">Send to customer</Button>
          </form>
        </Card>
        <Card className="border-0 p-5">
          <h2 className="font-semibold text-navy">Repair documentation</h2>
          <form action={saveRepairRecordAction} className="mt-4 space-y-3">
            <input type="hidden" name="jobId" value={job.id} />
            <Field label="What was done">
              <Input name="title" required defaultValue={job.repairRecord?.title ?? ""} placeholder="Front wheel bearing replacement" />
            </Field>
            <Field label="Diagnosis">
              <Textarea name="diagnosis" defaultValue={job.repairRecord?.diagnosis ?? ""} />
            </Field>
            <Field label="Parts replaced">
              <Input name="partsReplaced" defaultValue={job.repairRecord?.partsReplaced ?? ""} placeholder="Timken bearing" />
            </Field>
            <Field label="Part numbers">
              <Input name="partNumbers" defaultValue={job.repairRecord?.partNumbers ?? ""} />
            </Field>
            <Field label="Labor hours">
              <Input name="laborHours" defaultValue={job.repairRecord?.laborHours ?? ""} />
            </Field>
            <Field label="Mileage">
              <Input name="mileage" defaultValue={job.repairRecord?.mileage ?? job.vehicle.mileage} />
            </Field>
            <Field label="Warranty">
              <Input name="warrantySummary" defaultValue={job.repairRecord?.warrantySummary ?? "12 months / 12,000 miles"} />
            </Field>
            <Button type="submit">Save repair record</Button>
          </form>
        </Card>
        {job.thread ? (
          <ThreadView
            threadId={job.thread.id}
            selfId={session.id}
            title="Message customer"
            subtitle={`${job.customer.firstName} ${job.customer.lastName}`}
            jobHref={`/mechanic/messages/${job.thread.id}`}
            jobLabel="Open thread"
            returnTo={`/mechanic/jobs/${job.id}`}
            messages={job.thread.messages.map((message) => ({
              id: message.id,
              senderId: message.senderId,
              senderName: message.sender.firstName,
              body: message.body,
              createdAt: message.createdAt,
            }))}
          />
        ) : null}
      </section>
    </div>
  );
}
