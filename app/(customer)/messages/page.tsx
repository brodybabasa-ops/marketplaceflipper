import { EmptyState } from "@/components/ui/card";
import { ThemedBoard, BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { latestIsUnread, listThreadsForUser } from "@/services/messages";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await requireSession();
  const threads = await listThreadsForUser(session.id, session.role);
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
            const unread = latestIsUnread(thread.messages[0], session.id);
            return (
              <BoardLink key={thread.id} href={`/messages/${thread.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{title}</p>
                    <p className="truncate text-sm text-muted">{thread.messages[0]?.body}</p>
                    {thread.job ? (
                      <p className="mt-1 text-xs text-muted">{thread.job.serviceRequest.problemText}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-muted">{formatRelative(thread.lastMessageAt)}</p>
                    {unread ? (
                      <span className="mt-1 inline-flex rounded-full bg-[#2f7bff] px-2 py-0.5 text-[10px] font-bold text-white">
                        New
                      </span>
                    ) : null}
                  </div>
                </div>
              </BoardLink>
            );
          })
        )}
      </div>
    </ThemedBoard>
  );
}
