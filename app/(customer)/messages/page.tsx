import { CustomerMessagesView, type MessageThreadRow } from "@/components/customer-app/messages-view";
import { requireSession } from "@/lib/guards";
import { latestIsUnread, listThreadsForUser } from "@/services/messages";
import { prisma } from "@/lib/db";

export const metadata = { title: "Messages" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const threads = await listThreadsForUser(session.id, session.role, params.q);
  const unreadRows = await prisma.message.findMany({
    where: {
      readAt: null,
      senderId: { not: session.id },
      thread: { customerId: session.id },
    },
    select: { threadId: true },
  });
  const unreadMap = new Map<string, number>();
  for (const row of unreadRows) {
    unreadMap.set(row.threadId, (unreadMap.get(row.threadId) ?? 0) + 1);
  }

  const rows: MessageThreadRow[] = threads.map((thread) => {
    const title =
      session.id === thread.customerId
        ? thread.mechanic.mechanicProfile?.businessName ?? `${thread.mechanic.firstName} ${thread.mechanic.lastName}`
        : `${thread.customer.firstName} ${thread.customer.lastName}`;
    const preview = thread.messages[0]?.body ?? "No messages yet";
    const problem = thread.job?.serviceRequest.problemText ?? "";
    const kind: MessageThreadRow["kind"] = problem.toLowerCase().includes("estimate")
      ? "estimates"
      : thread.job
        ? "shops"
        : "support";
    return {
      id: thread.id,
      href: `/messages/${thread.id}`,
      shopName: title,
      shopSlug: thread.mechanic.mechanicProfile?.slug ?? null,
      verified: (thread.mechanic.mechanicProfile?.verificationLevel ?? "UNVERIFIED") !== "UNVERIFIED",
      preview,
      when: thread.lastMessageAt,
      unread: unreadMap.get(thread.id) ?? (latestIsUnread(thread.messages[0], session.id) ? 1 : 0),
      kind,
    };
  });

  return <CustomerMessagesView threads={rows} tab={params.tab ?? "all"} q={params.q ?? ""} />;
}
