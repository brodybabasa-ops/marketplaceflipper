import { EmptyState } from "@/components/ui/card";
import { BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Messages" };

export default async function MechanicMessagesPage() {
  const session = await requireSession("MECHANIC");
  const threads = await prisma.messageThread.findMany({
    where: { mechanicId: session.id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      job: true,
    },
    orderBy: { lastMessageAt: "desc" },
  });
  return (
    <div className="space-y-3">
      {threads.length === 0 ? (
        <EmptyState title="No conversations yet" body="Start from a job so the context stays with the work." />
      ) : (
        threads.map((thread) => (
          <BoardLink key={thread.id} href={thread.jobId ? `/mechanic/jobs/${thread.jobId}` : "/mechanic/jobs"}>
            <p className="font-semibold text-navy">
              {thread.customer.firstName} {thread.customer.lastName}
            </p>
            <p className="text-sm text-muted">{thread.messages[0]?.body}</p>
          </BoardLink>
        ))
      )}
    </div>
  );
}
