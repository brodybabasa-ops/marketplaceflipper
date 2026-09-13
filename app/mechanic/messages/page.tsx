import { EmptyState } from "@/components/ui/card";
import { BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { latestIsUnread, listThreadsForUser } from "@/services/messages";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MechanicMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const q = (await searchParams).q;
  const threads = await listThreadsForUser(session.id, session.role, q);
  return (
    <div className="space-y-3">
      {threads.length === 0 ? (
        <EmptyState
          title={q ? "No matching conversations" : "No conversations yet"}
          body="When a customer messages this shop or a job thread starts, it lands here. Replies show on their Messages board."
        />
      ) : (
        threads.map((thread) => {
          const unread = latestIsUnread(thread.messages[0], session.id);
          return (
            <BoardLink key={thread.id} href={`/mechanic/messages/${thread.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">
                    {thread.customer.firstName} {thread.customer.lastName}
                  </p>
                  <p className="truncate text-sm text-muted">{thread.messages[0]?.body ?? "No messages yet"}</p>
                  {thread.job ? (
                    <p className="mt-1 text-xs text-muted">{thread.job.serviceRequest.problemText}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">Shop conversation</p>
                  )}
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
  );
}
