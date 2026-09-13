import { notFound } from "next/navigation";
import { ThreadView } from "@/components/messages/thread-view";
import { PageHeading } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { getThreadForUser } from "@/services/messages";

export const metadata = { title: "Message" };

export default async function MechanicThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("MECHANIC");
  const { id } = await params;
  const thread = await getThreadForUser(id, session.id, session.role);
  if (!thread) notFound();
  return (
    <div>
      <PageHeading
        title={`${thread.customer.firstName} ${thread.customer.lastName}`}
        subtitle={thread.job ? thread.job.serviceRequest.problemText : "Customer conversation"}
      />
      <ThreadView
        threadId={thread.id}
        selfId={session.id}
        title={`${thread.customer.firstName} ${thread.customer.lastName}`}
        subtitle={
          thread.job
            ? `${thread.job.vehicle.year} ${thread.job.vehicle.make.name} ${thread.job.vehicle.model.name}`
            : undefined
        }
        jobHref={thread.jobId ? `/mechanic/jobs/${thread.jobId}` : null}
        jobLabel="Open job"
        returnTo={`/mechanic/messages/${thread.id}`}
        messages={thread.messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          senderName: message.sender.firstName,
          body: message.body,
          createdAt: message.createdAt,
        }))}
      />
    </div>
  );
}
