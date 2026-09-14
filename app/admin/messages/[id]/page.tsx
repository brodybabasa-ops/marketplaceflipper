import { notFound } from "next/navigation";
import { ThreadView } from "@/components/messages/thread-view";
import { requireSession } from "@/lib/guards";
import { getThreadForUser } from "@/services/messages";

export const metadata = { title: "Message" };

export default async function AdminThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("ADMIN");
  const { id } = await params;
  const thread = await getThreadForUser(id, session.id, session.role);
  if (!thread) notFound();
  const shop = thread.mechanic.mechanicProfile?.businessName ?? `${thread.mechanic.firstName} ${thread.mechanic.lastName}`;
  return (
    <ThreadView
      threadId={thread.id}
      selfId={session.id}
      title={`${thread.customer.firstName} ${thread.customer.lastName} → ${shop}`}
      subtitle={
        thread.job
          ? `${thread.job.vehicle.year} ${thread.job.vehicle.make.name} ${thread.job.vehicle.model.name} · ${thread.job.serviceRequest.problemText}`
          : undefined
      }
      jobHref={thread.jobId ? `/admin/jobs/${thread.jobId}` : null}
      jobLabel="Open job"
      markRead={false}
      returnTo={`/admin/messages/${thread.id}`}
      messages={thread.messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.firstName,
        body: message.body,
        createdAt: message.createdAt,
      }))}
    />
  );
}
