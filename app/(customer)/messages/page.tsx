import { EmptyState } from "@/components/ui/card";
import { ThemedBoard, BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await requireSession();
  const threads = await prisma.messageThread.findMany({
    where: session.role === "MECHANIC" ? { mechanicId: session.id } : { customerId: session.id },
    include: {
      customer: true,
      mechanic: { include: { mechanicProfile: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      job: true,
    },
    orderBy: { lastMessageAt: "desc" },
  });
  return (
    <ThemedBoard
      eyebrow="MESSAGES"
      title="Talk to the"
      accent="Shop."
      subtitle="Conversations stay attached to the job, not a random phone number."
      script="Stay in the Loop."
      image="/landing/lifestyle.png"
      wide={false}
    >
      <div className="space-y-3">
        {threads.length === 0 ? (
          <EmptyState title="No conversations yet" body="Start from a job or mechanic profile so the context stays with the work." />
        ) : (
          threads.map((thread) => {
            const title =
              session.id === thread.customerId
                ? thread.mechanic.mechanicProfile?.businessName ?? `${thread.mechanic.firstName} ${thread.mechanic.lastName}`
                : `${thread.customer.firstName} ${thread.customer.lastName}`;
            return (
              <BoardLink key={thread.id} href={thread.jobId ? `/jobs/${thread.jobId}` : `/messages/${thread.id}`}>
                <p className="font-semibold text-navy">{title}</p>
                <p className="text-sm text-muted">{thread.messages[0]?.body}</p>
              </BoardLink>
            );
          })
        )}
      </div>
    </ThemedBoard>
  );
}
