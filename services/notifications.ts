import { prisma } from "@/lib/db";
import type { NotificationChannel } from "@prisma/client";
import { shopPhotoFor, vehiclePhotoFor } from "@/lib/landing";

export type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  href?: string;
  channel?: NotificationChannel;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
  related: { title: string; subtitle: string; photo: string } | null;
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

function uuidFromHref(href: string | null | undefined, prefix: string) {
  if (!href) return null;
  const match = href.match(new RegExp(`${prefix}/([0-9a-f-]{36})`, "i"));
  return match?.[1] ?? null;
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const jobIds = [...new Set(notifications.map((item) => uuidFromHref(item.href, "/jobs")).filter(Boolean))] as string[];
  const threadIds = [...new Set(notifications.map((item) => uuidFromHref(item.href, "/messages")).filter(Boolean))] as string[];
  const [jobs, threads] = await Promise.all([
    jobIds.length
      ? prisma.job.findMany({
          where: { id: { in: jobIds } },
          include: {
            vehicle: { include: { make: true, model: true } },
            serviceRequest: true,
            mechanicProfile: true,
          },
        })
      : [],
    threadIds.length
      ? prisma.messageThread.findMany({
          where: { id: { in: threadIds } },
          include: {
            job: { include: { vehicle: { include: { make: true, model: true } }, serviceRequest: true } },
            mechanic: { include: { mechanicProfile: true } },
          },
        })
      : [],
  ]);
  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const threadMap = new Map(threads.map((thread) => [thread.id, thread]));

  return notifications.map((item) => {
    const jobId = uuidFromHref(item.href, "/jobs");
    const threadId = uuidFromHref(item.href, "/messages");
    const thread = threadId ? threadMap.get(threadId) : undefined;
    const job = jobId ? jobMap.get(jobId) : thread?.job ?? undefined;
    if (job) {
      return {
        ...item,
        related: {
          title: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`,
          subtitle: job.serviceRequest.problemText,
          photo: vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name),
        },
      };
    }
    if (thread) {
      const shop = thread.mechanic.mechanicProfile?.businessName ?? "Shop";
      return {
        ...item,
        related: {
          title: shop,
          subtitle: "Conversation",
          photo: shopPhotoFor(thread.mechanic.mechanicProfile?.slug ?? "precision-auto-care"),
        },
      };
    }
    return { ...item, related: null };
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
