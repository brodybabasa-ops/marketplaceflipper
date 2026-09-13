import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusTimeline } from "@/components/jobs/status-timeline";
import { EstimateCard } from "@/components/jobs/estimate-card";
import { AppointmentCard } from "@/components/jobs/appointment-card";
import { JobPhotos } from "@/components/jobs/job-photos";
import { ThreadView } from "@/components/messages/thread-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { updateJobStatusAction } from "@/app/actions/marketplace";
import { requireSession } from "@/lib/guards";
import { getJobForUser } from "@/services/jobs";
import { ALLOWED_JOB_TRANSITIONS } from "@/services/mechanics";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Job" };

export default async function AdminJobPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("ADMIN");
  const { id } = await params;
  const job = await getJobForUser(id, session.id, session.role);
  if (!job) notFound();
  const nextStatuses = ALLOWED_JOB_TRANSITIONS[job.status];
  return (
    <div>
      <p className="text-sm text-muted">
        {job.customer.firstName} {job.customer.lastName} → {job.mechanicProfile.businessName} ·{" "}
        {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
      </p>
      <h2 className="mt-1 text-2xl font-bold text-navy">{job.serviceRequest.problemText}</h2>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <Link href={`/admin/messages`} className="font-semibold text-[#7eb0ff]">
          All messages →
        </Link>
        {job.thread ? (
          <Link href={`/admin/messages/${job.thread.id}`} className="font-semibold text-[#7eb0ff]">
            This thread →
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
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
        </Card>
        <Card className="border-0 p-5">
          <h2 className="font-semibold text-navy">Request details</h2>
          <p className="mt-2 text-sm">{job.serviceRequest.description || job.serviceRequest.problemText}</p>
          {job.totalCents ? (
            <p className="mt-3 text-lg font-semibold">{formatCents(job.totalCents)}</p>
          ) : null}
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

      <section className="mt-6 space-y-4">
        {job.estimates.map((estimate) => (
          <EstimateCard key={estimate.id} estimate={estimate} />
        ))}
        {job.thread ? (
          <ThreadView
            threadId={job.thread.id}
            selfId={session.id}
            title="Job messages"
            markRead={false}
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
