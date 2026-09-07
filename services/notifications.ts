import { prisma } from "@/lib/db";
import type { NotificationChannel } from "@prisma/client";

export type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  href?: string;
  channel?: NotificationChannel;
};

async function sendEmail(input: NotificationInput, email: string) {
  if (!process.env.RESEND_API_KEY) {
    console.info("[email:mock]", email, input.title);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Pocket Mechanic <hello@example.com>",
      to: [email],
      subject: input.title,
      text: `${input.body}\n\n${input.href ? `${process.env.NEXT_PUBLIC_APP_URL}${input.href}` : ""}`,
    }),
  });
  if (!response.ok) {
    console.error("[email:resend-failed]", await response.text());
  }
}

async function sendSms(input: NotificationInput, phone: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.info("[sms:mock]", phone, input.title);
    return;
  }
  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({
    To: phone,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: `${input.title}: ${input.body}`,
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );
  if (!response.ok) {
    console.error("[sms:twilio-failed]", await response.text());
  }
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
  if (channel === "IN_APP") return;
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return;
  if (channel === "EMAIL" && user.emailNotifications) await sendEmail(input, user.email);
  if (channel === "SMS" && user.smsNotifications && user.phone) await sendSms(input, user.phone);
}

export async function notifyUser(input: Omit<NotificationInput, "channel">) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  await notify({ ...input, channel: "IN_APP" });
  if (user?.emailNotifications) await notify({ ...input, channel: "EMAIL" });
  if (user?.smsNotifications && user.phone) await notify({ ...input, channel: "SMS" });
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null, channel: "IN_APP" } });
}

export async function markNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
