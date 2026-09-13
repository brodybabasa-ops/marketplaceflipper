"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SchedulerBlockKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession, safeInternalPath } from "@/lib/session";
import {
  createSchedulerHold,
  optimizeShopDay,
  swapJobTimes,
} from "@/services/scheduler";

async function requireMechanic() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "MECHANIC" && session.role !== "ADMIN") throw new Error("Not authorized.");
  return session;
}

function bounce(formData: FormData) {
  revalidatePath("/mechanic/schedule");
  revalidatePath("/mechanic");
  revalidatePath("/mechanic/jobs");
  revalidatePath("/appointments");
  const next = safeInternalPath(formData.get("returnTo")) ?? "/mechanic/schedule";
  redirect(next);
}

export async function optimizeScheduleAction(formData: FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  await optimizeShopDay({
    profileId: profile.id,
    actorId: session.id,
    date: String(formData.get("date") ?? ""),
  });
  bounce(formData);
}

export async function createSchedulerBlockAction(formData: FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const kind = String(formData.get("kind") ?? "BLOCK") as SchedulerBlockKind;
  const allowed: SchedulerBlockKind[] = ["LUNCH", "TRAVEL", "BUFFER", "BREAK", "BLOCK"];
  await createSchedulerHold({
    profileId: profile.id,
    actorId: session.id,
    resourceId: String(formData.get("resourceId") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    durationMinutes: Number(formData.get("durationMinutes") || 30),
    kind: allowed.includes(kind) ? kind : "BLOCK",
    label: String(formData.get("label") ?? "") || undefined,
  });
  bounce(formData);
}

export async function swapScheduleJobsAction(formData: FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  await swapJobTimes({
    profileId: profile.id,
    actorId: session.id,
    jobA: String(formData.get("jobA") ?? ""),
    jobB: String(formData.get("jobB") ?? ""),
  });
  bounce(formData);
}
