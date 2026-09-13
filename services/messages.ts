import { prisma } from "@/lib/db";
import { notify } from "@/services/notifications";

export async function markThreadRead(threadId: string, userId: string) {
  await prisma.message.updateMany({
    where: { threadId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
}

export function latestIsUnread(
  message: { senderId: string; readAt: Date | null } | undefined,
  userId: string,
) {
  return Boolean(message && message.senderId !== userId && !message.readAt);
}

export async function listThreadsForUser(userId: string, role: string) {
  const where = role === "ADMIN" ? {} : role === "MECHANIC" ? { mechanicId: userId } : { customerId: userId };
  return prisma.messageThread.findMany({
    where,
    include: {
      customer: true,
      mechanic: { include: { mechanicProfile: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      job: {
        include: {
          serviceRequest: true,
          vehicle: { include: { make: true, model: true } },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: role === "ADMIN" ? 80 : 50,
  });
}

export async function getThreadForUser(threadId: string, userId: string, role: string) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      customer: true,
      mechanic: { include: { mechanicProfile: true } },
      job: {
        include: {
          serviceRequest: true,
          vehicle: { include: { make: true, model: true } },
          mechanicProfile: true,
        },
      },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) return null;
  if (role === "ADMIN") return thread;
  if (thread.customerId !== userId && thread.mechanicId !== userId) return null;
  return thread;
}

export async function getOrCreateShopThread(customerId: string, mechanicProfileId: string) {
  const profile = await prisma.mechanicProfile.findUnique({
    where: { id: mechanicProfileId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!profile) return null;
  const existing = await prisma.messageThread.findFirst({
    where: { customerId, mechanicId: profile.userId },
    orderBy: { lastMessageAt: "desc" },
  });
  if (existing) return { thread: existing, created: false, profile };
  const thread = await prisma.messageThread.create({
    data: {
      customerId,
      mechanicId: profile.userId,
    },
  });
  await notify({
    userId: profile.userId,
    title: "New message from a customer",
    body: "Open the conversation to reply.",
    href: `/mechanic/messages/${thread.id}`,
  });
  return { thread, created: true, profile };
}
