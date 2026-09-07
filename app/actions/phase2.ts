"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DayOfWeek, PhotoKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { chargeJob, connectMechanicPayouts } from "@/services/checkout";
import { confirmAppointment, proposeAppointment, saveWeeklyAvailability } from "@/services/scheduling";
import { markNotificationsRead } from "@/services/notifications";
import { notifyUser } from "@/services/notifications";
import { getJobForUser } from "@/services/jobs";
import { saveUpload } from "@/lib/uploads";

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function payJobAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  await chargeJob({ jobId, customerId: session.id });
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}?paid=1`);
}

export async function connectPayoutsAction() {
  const session = await requireUser();
  await connectMechanicPayouts(session.id);
  revalidatePath("/mechanic/earnings");
}

export async function proposeAppointmentAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const scheduledAt = new Date(String(formData.get("scheduledAt")));
  if (Number.isNaN(scheduledAt.getTime())) throw new Error("Choose a valid date and time.");
  await proposeAppointment({ jobId, actorId: session.id, scheduledAt, role: session.role });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/mechanic/jobs/${jobId}`);
  revalidatePath("/mechanic/schedule");
}

export async function confirmAppointmentAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  await confirmAppointment(jobId, session.id);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/mechanic/jobs/${jobId}`);
}

export async function saveAvailabilityAction(formData: FormData) {
  const session = await requireUser();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as DayOfWeek[];
  await saveWeeklyAvailability(
    profile.id,
    days.map((dayOfWeek) => ({
      dayOfWeek,
      enabled: formData.get(`enabled_${dayOfWeek}`) === "on",
      startTime: String(formData.get(`start_${dayOfWeek}`) || "08:00"),
      endTime: String(formData.get(`end_${dayOfWeek}`) || "18:00"),
    })),
  );
  revalidatePath("/mechanic/schedule");
}

export async function addBlockedDateAction(formData: FormData) {
  const session = await requireUser();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const date = new Date(String(formData.get("date")));
  await prisma.mechanicBlockedDate.upsert({
    where: { mechanicProfileId_date: { mechanicProfileId: profile.id, date } },
    update: { reason: String(formData.get("reason") || "") || null },
    create: { mechanicProfileId: profile.id, date, reason: String(formData.get("reason") || "") || null },
  });
  revalidatePath("/mechanic/schedule");
}

export async function toggleSavedMechanicAction(formData: FormData) {
  const session = await requireUser();
  const mechanicProfileId = String(formData.get("mechanicProfileId"));
  const existing = await prisma.savedMechanic.findUnique({
    where: { customerId_mechanicProfileId: { customerId: session.id, mechanicProfileId } },
  });
  if (existing) {
    await prisma.savedMechanic.delete({ where: { id: existing.id } });
    await prisma.favorite.deleteMany({
      where: { userId: session.id, targetType: "mechanic", targetId: mechanicProfileId },
    });
  } else {
    await prisma.savedMechanic.create({ data: { customerId: session.id, mechanicProfileId } });
    await prisma.favorite.create({
      data: { userId: session.id, targetType: "mechanic", targetId: mechanicProfileId },
    });
  }
  const profile = await prisma.mechanicProfile.findUnique({ where: { id: mechanicProfileId } });
  revalidatePath("/saved");
  revalidatePath("/home");
  revalidatePath("/mechanics");
  if (profile) revalidatePath(`/mechanics/${profile.slug}`);
}

export async function addJobPhotoAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const job = await getJobForUser(jobId, session.id, session.role);
  if (!job) throw new Error("Job not found.");
  const file = formData.get("file");
  let url = String(formData.get("url") || "").trim();
  if (file instanceof File && file.size > 0) {
    url = await saveUpload(file);
  }
  if (!url) throw new Error("Add a photo file or a URL.");
  await prisma.jobPhoto.create({
    data: {
      jobId,
      kind: (String(formData.get("kind") || "OTHER") as PhotoKind) || "OTHER",
      url,
      caption: String(formData.get("caption") || "") || null,
    },
  });
  await notifyUser({
    userId: session.id === job.customerId ? job.mechanicUserId : job.customerId,
    title: "New job photo",
    body: String(formData.get("caption") || "A photo was added to the repair record."),
    href: `/jobs/${jobId}`,
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/mechanic/jobs/${jobId}`);
}

export async function markNotificationsReadAction() {
  const session = await requireUser();
  await markNotificationsRead(session.id);
  revalidatePath("/notifications");
}

export async function updateNotificationPrefsAction(formData: FormData) {
  const session = await requireUser();
  await prisma.user.update({
    where: { id: session.id },
    data: {
      phone: String(formData.get("phone") || "") || null,
      emailNotifications: formData.get("emailNotifications") === "on",
      smsNotifications: formData.get("smsNotifications") === "on",
    },
  });
  revalidatePath("/account");
  revalidatePath("/mechanic/settings");
}
