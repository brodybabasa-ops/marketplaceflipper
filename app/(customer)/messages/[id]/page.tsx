import { notFound } from "next/navigation";
import { CustomerThreadView } from "@/components/customer-app/thread-view";
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
    <CustomerThreadView
      threadId={thread.id}
      selfId={session.id}
      shopName={shop}
      shopSlug={thread.mechanic.mechanicProfile?.slug}
      verified={(thread.mechanic.mechanicProfile?.verificationLevel ?? "UNVERIFIED") !== "UNVERIFIED"}
      subtitle={
        thread.job
          ? `${thread.job.vehicle.year} ${thread.job.vehicle.make.name} ${thread.job.vehicle.model.name}`
          : "Typically replies in a few minutes"
      }
      messages={thread.messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.firstName,
        body: message.body,
        createdAt: message.createdAt,
        attachmentUrl: message.attachmentUrl,
        kind: message.kind,
      }))}
    />
  );
}
