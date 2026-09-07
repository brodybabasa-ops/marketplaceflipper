import type { DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/services/notifications";
import { transitionJob } from "@/services/jobs";

const DAY_MAP: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function proposeAppointment(input: { jobId: string; actorId: string; scheduledAt: Date; role: string }) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: input.jobId },
    include: { mechanicProfile: { include: { availability: true, blockedDates: true } } },
  });
  if (job.customerId !== input.actorId && job.mechanicUserId !== input.actorId) {
    throw new Error("Not authorized.");
  }

  const day = DAY_MAP[input.scheduledAt.getDay()];
  const window = job.mechanicProfile.availability.find((item) => item.dayOfWeek === day);
  if (!window) {
    throw new Error(`${day.toLowerCase()} is not on this mechanic's schedule.`);
  }
  const minutes = input.scheduledAt.getHours() * 60 + input.scheduledAt.getMinutes();
  if (minutes < toMinutes(window.startTime) || minutes > toMinutes(window.endTime)) {
    throw new Error(`That time is outside ${window.startTime}–${window.endTime}.`);
  }
  const dateKey = input.scheduledAt.toISOString().slice(0, 10);
  if (job.mechanicProfile.blockedDates.some((item) => item.date.toISOString().slice(0, 10) === dateKey)) {
    throw new Error("That date is blocked on the mechanic's calendar.");
  }

  await prisma.job.update({
    where: { id: job.id },
    data: { scheduledAt: input.scheduledAt, scheduledConfirmedAt: null },
  });

  if (job.status === "REQUESTED") {
    await transitionJob(job.id, "ACCEPTED", input.actorId, "Appointment proposed.");
    await transitionJob(job.id, "SCHEDULED", input.actorId, "Appointment proposed.");
  } else if (job.status === "ACCEPTED") {
    await transitionJob(job.id, "SCHEDULED", input.actorId, "Appointment proposed.");
  } else {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        events: { create: { status: job.status, note: `Appointment proposed for ${input.scheduledAt.toLocaleString()}` } },
      },
    });
  }

  const notifyId = input.actorId === job.customerId ? job.mechanicUserId : job.customerId;
  await notifyUser({
    userId: notifyId,
    title: "Appointment proposed",
    body: `${input.scheduledAt.toLocaleString()} needs confirmation.`,
    href: input.actorId === job.customerId ? `/mechanic/jobs/${job.id}` : `/jobs/${job.id}`,
  });
}

export async function confirmAppointment(jobId: string, actorId: string) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  if (job.customerId !== actorId && job.mechanicUserId !== actorId) throw new Error("Not authorized.");
  if (!job.scheduledAt) throw new Error("No appointment has been proposed yet.");
  await prisma.job.update({
    where: { id: jobId },
    data: {
      scheduledConfirmedAt: new Date(),
      status: job.status === "ACCEPTED" || job.status === "REQUESTED" ? "SCHEDULED" : job.status,
      events: { create: { status: "SCHEDULED", note: "Appointment confirmed." } },
    },
  });
  await notifyUser({
    userId: actorId === job.customerId ? job.mechanicUserId : job.customerId,
    title: "Appointment confirmed",
    body: job.scheduledAt.toLocaleString(),
    href: actorId === job.customerId ? `/mechanic/jobs/${job.id}` : `/jobs/${job.id}`,
  });
}

export async function saveWeeklyAvailability(
  mechanicProfileId: string,
  days: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; enabled: boolean }[],
) {
  await prisma.mechanicAvailability.deleteMany({ where: { mechanicProfileId } });
  await prisma.mechanicAvailability.createMany({
    data: days
      .filter((day) => day.enabled)
      .map((day) => ({
        mechanicProfileId,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
      })),
  });
}
