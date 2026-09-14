import { redirect } from "next/navigation";
import { ShopMessagesBoard } from "@/components/shop-os/messages-view";
import { requireSession } from "@/lib/guards";
import { latestIsUnread, listThreadsForUser, unreadMessageCount } from "@/services/messages";

export const metadata = { title: "Messages" };

export default async function MechanicMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { q, tab: tabParam } = await searchParams;
  const tab = (["all", "unread", "customers", "estimates", "jobs", "archived"].includes(tabParam ?? "") ? tabParam : "all") as
    | "all"
    | "unread"
    | "customers"
    | "estimates"
    | "jobs"
    | "archived";
  const threads = await listThreadsForUser(session.id, session.role, q);
  const unreadCount = await unreadMessageCount(session.id, session.role);
  const filtered = threads.filter((thread) => {
    if (tab === "unread") return latestIsUnread(thread.messages[0], session.id);
    if (tab === "jobs") return Boolean(thread.jobId);
    if (tab === "customers") return !thread.jobId;
    if (tab === "estimates") return Boolean(thread.job);
    if (tab === "archived") return false;
    return true;
  });
  if (filtered[0] && !q) {
    redirect(`/mechanic/messages/${filtered[0].id}${tab !== "all" ? `?tab=${tab}` : ""}`);
  }
  return (
    <ShopMessagesBoard
      threads={filtered}
      selected={null}
      selfId={session.id}
      tab={tab}
      q={q}
      unreadCount={unreadCount}
    />
  );
}
