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
