import type { Prisma } from "@prisma/client";
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

export async function unreadMessageCount(userId: string, role: string) {
  const threadWhere: Prisma.MessageThreadWhereInput =
    role === "ADMIN" ? {} : role === "MECHANIC" ? { mechanicId: userId } : { customerId: userId };
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      thread: threadWhere,
    },
  });
}

function threadSearchWhere(term?: string | null): Prisma.MessageThreadWhereInput {
  const q = term?.trim();
  if (!q) return {};
  return {
    OR: [
      { customer: { firstName: { contains: q, mode: "insensitive" } } },
      { customer: { lastName: { contains: q, mode: "insensitive" } } },
      { mechanic: { firstName: { contains: q, mode: "insensitive" } } },
      { mechanic: { lastName: { contains: q, mode: "insensitive" } } },
      { mechanic: { mechanicProfile: { businessName: { contains: q, mode: "insensitive" } } } },
      { messages: { some: { body: { contains: q, mode: "insensitive" } } } },
      { job: { serviceRequest: { problemText: { contains: q, mode: "insensitive" } } } },
    ],
  };
}

export async function listThreadsForUser(userId: string, role: string, q?: string | null) {
  const ownerWhere: Prisma.MessageThreadWhereInput =
    role === "ADMIN" ? {} : role === "MECHANIC" ? { mechanicId: userId } : { customerId: userId };
  const search = threadSearchWhere(q);
  return prisma.messageThread.findMany({
    where: Object.keys(search).length ? { AND: [ownerWhere, search] } : ownerWhere,
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

export async function listUnreadThreadsForMechanic(userId: string, take = 6) {
  return prisma.messageThread.findMany({
    where: {
      mechanicId: userId,
      messages: { some: { senderId: { not: userId }, readAt: null } },
    },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      job: { include: { serviceRequest: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take,
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
  return { thread, created: true, profile };
}

export async function postThreadMessage(input: {
  threadId: string;
  senderId: string;
  senderRole: string;
  body: string;
}) {
  const body = input.body.trim();
  if (!body) throw new Error("Message cannot be empty.");
  const thread = await prisma.messageThread.findUnique({
    where: { id: input.threadId },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      mechanic: { include: { mechanicProfile: { select: { businessName: true } } } },
    },
  });
  if (!thread) throw new Error("Conversation not found.");
  const isCustomer = thread.customerId === input.senderId;
  const isMechanic = thread.mechanicId === input.senderId;
  if (!isCustomer && !isMechanic && input.senderRole !== "ADMIN") {
    throw new Error("Not authorized.");
  }

  const message = await prisma.message.create({
    data: { threadId: thread.id, senderId: input.senderId, body },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date() },
  });

  const shopName =
    thread.mechanic.mechanicProfile?.businessName ?? thread.mechanic.firstName;
  const customerName = `${thread.customer.firstName} ${thread.customer.lastName}`.trim();
  const recipients =
    isCustomer
      ? [{ userId: thread.mechanicId, href: `/mechanic/messages/${thread.id}`, title: `Message from ${customerName}` }]
      : isMechanic
        ? [{ userId: thread.customerId, href: `/messages/${thread.id}`, title: `Message from ${shopName}` }]
        : [
            { userId: thread.customerId, href: `/messages/${thread.id}`, title: `Message from ${shopName}` },
            { userId: thread.mechanicId, href: `/mechanic/messages/${thread.id}`, title: `Message from ${customerName}` },
          ];

  for (const recipient of recipients) {
    if (recipient.userId === input.senderId) continue;
    await notify({
      userId: recipient.userId,
      title: recipient.title,
      body,
      href: recipient.href,
    });
  }

  return { thread, message };
}

export function threadPathForRole(threadId: string, role: string) {
  if (role === "MECHANIC") return `/mechanic/messages/${threadId}`;
  if (role === "ADMIN") return `/admin/messages/${threadId}`;
  return `/messages/${threadId}`;
}
