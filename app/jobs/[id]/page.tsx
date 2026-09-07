import { notFound } from "next/navigation";
import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { StatusTimeline } from "@/components/jobs/status-timeline";
import { EstimateCard } from "@/components/jobs/estimate-card";
import { ReviewCard } from "@/components/jobs/review-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select, Textarea, Input } from "@/components/ui/input";
import { createDisputeAction, createReviewAction, sendMessageAction } from "@/app/actions/marketplace";
import { AppointmentCard } from "@/components/jobs/appointment-card";
import { JobPhotoGallery } from "@/components/jobs/job-photos";
import { requireSession } from "@/lib/guards";
import { getJobForUser } from "@/services/jobs";
import { formatCents } from "@/lib/money";
import Link from "next/link";

export const metadata = { title: "Job" };

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const job = await getJobForUser(id, session.id, session.role);
  if (!job) notFound();
  const latestPayment = job.payments[0];
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {session.role === "CUSTOMER" ? <AppNav items={CUSTOMER_NAV} current="/jobs" /> : null}
      <p className="text-sm text-muted">{job.mechanicProfile.businessName}</p>
      <h1 className="text-3xl font-bold text-navy">{job.serviceRequest.problemText}</h1>
      <p className="mt-1 text-muted">
        {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
      </p>
      {session.role === "CUSTOMER" &&
      job.paymentStatus !== "PAID" &&
      job.totalCents > 0 &&
      (job.status === "COMPLETED" || job.status === "DISPUTED") ? (
        <Button asChild className="mt-4">
          <Link href={`/jobs/${job.id}/pay`}>Pay {formatCents(job.totalCents)}</Link>
        </Button>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-navy">Status</h2>
            <div className="mt-4">
              <StatusTimeline status={job.status} />
            </div>
          </Card>
          <AppointmentCard
            jobId={job.id}
            scheduledAt={job.scheduledAt}
            confirmedAt={job.scheduledConfirmedAt}
            canPropose
          />
          {job.estimates.map((estimate) => (
            <EstimateCard key={estimate.id} estimate={estimate} canApprove={session.role === "CUSTOMER"} />
          ))}
          <JobPhotoGallery photos={job.photos} jobId={job.id} canUpload />
          {job.repairRecord ? (
            <Card className="p-5">
              <h2 className="font-semibold text-navy">Repair completed</h2>
              <p className="mt-2 text-lg font-semibold">{job.repairRecord.title}</p>
              <p className="text-sm text-muted">
                {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                {job.repairRecord.mileage ? ` · ${job.repairRecord.mileage.toLocaleString()} miles` : ""}
              </p>
              {job.repairRecord.partsReplaced ? <p className="mt-2 text-sm">Parts: {job.repairRecord.partsReplaced}</p> : null}
              {job.repairRecord.laborHours ? <p className="text-sm">Labor: {job.repairRecord.laborHours} hours</p> : null}
              {job.repairRecord.warrantySummary ? <p className="text-sm">Warranty: {job.repairRecord.warrantySummary}</p> : null}
              {job.totalCents ? <p className="mt-2 number font-semibold">{formatCents(job.totalCents)}</p> : null}
              <p className="mt-1 text-sm text-muted">
                Payment: {job.paymentStatus.toLowerCase()}
                {latestPayment ? ` · ${formatCents(latestPayment.amountCents)} via ${latestPayment.provider}` : ""}
              </p>
            </Card>
          ) : null}
          {job.status === "COMPLETED" && !job.review && session.role === "CUSTOMER" ? (
            <Card className="p-5">
              <h2 className="font-semibold text-navy">Leave a review</h2>
              <p className="text-sm text-muted">Only completed Pocket Mechanic jobs can be reviewed.</p>
              <form action={createReviewAction} className="mt-4 space-y-3">
                <input type="hidden" name="jobId" value={job.id} />
                {["overallRating", "communicationRating", "professionalismRating", "pricingRating", "timelinessRating", "qualityRating"].map((name) => (
                  <Field key={name} label={name.replace("Rating", "").replace(/([A-Z])/g, " $1")}>
                    <Select name={name} defaultValue="5">
                      <option>5</option>
                      <option>4</option>
                      <option>3</option>
                      <option>2</option>
                      <option>1</option>
                    </Select>
                  </Field>
                ))}
                <Field label="Would you use this mechanic again?">
                  <Select name="wouldUseAgain" defaultValue="yes">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
                <Field label="Review">
                  <Textarea name="body" required placeholder="What happened, and how did it go?" />
                </Field>
                <Button type="submit">Submit review</Button>
              </form>
            </Card>
          ) : null}
          {job.review ? <ReviewCard review={{ ...job.review, customer: job.customer }} /> : null}
        </div>
        <div className="space-y-4">
          {job.thread ? (
            <Card className="p-5">
              <h2 className="font-semibold text-navy">Messages</h2>
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                {job.thread.messages.map((message) => (
                  <div key={message.id} className={message.senderId === session.id ? "text-right" : ""}>
                    <div className={`inline-block rounded-2xl px-3 py-2 text-sm ${message.senderId === session.id ? "bg-navy text-white" : "bg-paper"}`}>
                      {message.body}
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{message.createdAt.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <form action={sendMessageAction} className="mt-3 flex gap-2">
                <input type="hidden" name="threadId" value={job.thread.id} />
                <Input name="body" placeholder="Ask a question" />
                <Button type="submit">Send</Button>
              </form>
            </Card>
          ) : null}
          {session.role === "CUSTOMER" ? (
            <Card className="p-5">
              <h2 className="font-semibold text-navy">Report a problem</h2>
              <form action={createDisputeAction} className="mt-3 space-y-3">
                <input type="hidden" name="jobId" value={job.id} />
                <Select name="category" defaultValue="OTHER">
                  <option value="REPAIR_DIDNT_FIX">Repair didn't fix issue</option>
                  <option value="UNEXPECTED_CHARGE">Unexpected charge</option>
                  <option value="WORKMANSHIP">Workmanship concern</option>
                  <option value="NO_SHOW">Mechanic didn't show</option>
                  <option value="VEHICLE_DAMAGE">Vehicle damage</option>
                  <option value="COMMUNICATION">Communication issue</option>
                  <option value="OTHER">Other</option>
                </Select>
                <Textarea name="description" required placeholder="What happened?" />
                <Button type="submit" variant="secondary">
                  Open dispute
                </Button>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
