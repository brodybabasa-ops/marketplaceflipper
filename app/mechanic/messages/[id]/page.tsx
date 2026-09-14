import { notFound } from "next/navigation";
import { ShopMessagesBoard } from "@/components/shop-os/messages-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { getThreadForUser, listThreadsForUser, markThreadRead, unreadMessageCount } from "@/services/messages";

export const metadata = { title: "Message" };

export default async function MechanicThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { id } = await params;
  const { q, tab: tabParam } = await searchParams;
  const tab = "all" as const;
  const thread = await getThreadForUser(id, session.id, session.role);
  if (!thread) notFound();
  await markThreadRead(thread.id, session.id);
  const [threads, unreadCount, job] = await Promise.all([
    listThreadsForUser(session.id, session.role, q),
    unreadMessageCount(session.id, session.role),
    thread.jobId
      ? prisma.job.findUnique({
          where: { id: thread.jobId },
          include: {
            serviceRequest: true,
            vehicle: { include: { make: true, model: true } },
            estimates: { orderBy: { createdAt: "desc" }, take: 4 },
          },
        })
      : Promise.resolve(null),
  ]);
  return (
    <ShopMessagesBoard
      threads={threads}
      selected={{
        id: thread.id,
        customer: thread.customer,
        job: job
          ? {
              id: job.id,
              status: job.status,
              repairOrderNumber: job.repairOrderNumber,
              scheduledAt: job.scheduledAt,
              serviceRequest: job.serviceRequest,
              vehicle: job.vehicle,
              estimates: job.estimates,
            }
          : null,
        messages: thread.messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          senderName: message.sender.firstName,
          body: message.body,
          createdAt: message.createdAt,
        })),
      }}
      selfId={session.id}
      tab={tabParam === "unread" ? "unread" : tab}
      q={q}
      unreadCount={unreadCount}
    />
  );
}
