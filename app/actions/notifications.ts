"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { notificationsPath } from "@/lib/notifications";
import { markAllNotificationsRead, markNotificationRead } from "@/services/notifications";

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function openNotificationAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  const notification = await markNotificationRead(id, session.id);
  revalidatePath("/home");
  revalidatePath("/notifications");
  revalidatePath("/mechanic/notifications");
  revalidatePath("/admin/notifications");
  redirect(notification?.href || notificationsPath(session.role));
}

export async function markAllNotificationsReadAction() {
  const session = await requireUser();
  await markAllNotificationsRead(session.id);
  revalidatePath("/home");
  revalidatePath("/notifications");
  revalidatePath("/mechanic/notifications");
  revalidatePath("/admin/notifications");
}
