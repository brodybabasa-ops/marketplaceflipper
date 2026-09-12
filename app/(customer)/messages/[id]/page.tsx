import { notFound } from "next/navigation";
import { ThreadView } from "@/components/messages/thread-view";
import { ThemedBoard } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { getThreadForUser } from "@/services/messages";

export const metadata = { title: "Message" };

export default async function CustomerThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("CUSTOMER");
  const { id } = await params;
  const thread = await getThreadForUser(id, session.id, session.role);
  if (!thread) notFound();
  const shop = thread.mechanic.mechanicProfile?.businessName ?? `${thread.mechanic.firstName} ${thread.mechanic.lastName}`;
  return (
    <ThemedBoard
      eyebrow="MESSAGES"
      title="Talk to"
      accent={shop}
      subtitle={thread.job ? thread.job.serviceRequest.problemText : "Conversation with the shop."}
      script="Stay in the Loop."
      image="/landing/lifestyle.png"
      wide={false}
    >
      <ThreadView
        threadId={thread.id}
        selfId={session.id}
        title={shop}
        subtitle={
          thread.job
            ? `${thread.job.vehicle.year} ${thread.job.vehicle.make.name} ${thread.job.vehicle.model.name}`
            : undefined
        }
        jobHref={thread.jobId ? `/jobs/${thread.jobId}` : null}
        jobLabel="Open repair"
        messages={thread.messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          senderName: message.sender.firstName,
          body: message.body,
          createdAt: message.createdAt,
        }))}
      />
    </ThemedBoard>
  );
}
