import { prisma } from "@/lib/db";
import type { NotificationChannel } from "@prisma/client";

export type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  href?: string;
  channel?: NotificationChannel;
};

async function sendEmail(input: NotificationInput) {
  if (!process.env.RESEND_API_KEY) {
    console.info("[email:mock]", input.title, input.userId);
    return;
  }
  console.info("[email:resend-pending]", input.title);
}

async function sendSms(input: NotificationInput) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.info("[sms:mock]", input.title, input.userId);
    return;
  }
  console.info("[sms:twilio-pending]", input.title);
}

export async function notify(input: NotificationInput) {
  const channel = input.channel ?? "IN_APP";
  await prisma.notification.create({
    data: {
      userId: input.userId,
      channel,
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });
  if (channel === "EMAIL") await sendEmail(input);
  if (channel === "SMS") await sendSms(input);
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(id: string, userId: string) {
  const existing = await prisma.notification.findFirst({ where: { id, userId } });
  if (!existing) return null;
  if (existing.readAt) return existing;
  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
