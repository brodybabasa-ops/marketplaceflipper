"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma, type SchedulerBlockKind, type SchedulerResourceKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession, safeInternalPath } from "@/lib/session";
import { parseBoardLayout } from "@/lib/board-layout";
import {
  createSchedulerHold,
  createShopResource,
  deleteShopResource,
  optimizeShopDay,
  reorderShopResources,
  saveShopBoardLayout,
  swapJobTimes,
  updateShopResource,
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

export async function saveSchedulerLayoutAction(input: ReturnType<typeof parseBoardLayout> | FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  let raw: unknown = input;
  if (input instanceof FormData) {
    try {
      raw = JSON.parse(String(input.get("layout") ?? "{}"));
    } catch {
      raw = {};
    }
  }
  await saveShopBoardLayout(profile.id, parseBoardLayout(raw));
  revalidatePath("/mechanic/schedule");
  revalidatePath("/mechanic/settings");
}

export async function resetSchedulerLayoutAction(formData: FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  await prisma.mechanicProfile.update({
    where: { id: profile.id },
    data: { schedulerLayout: Prisma.DbNull },
  });
  revalidatePath("/mechanic/schedule");
  revalidatePath("/mechanic/settings");
  bounce(formData);
}

export async function createSchedulerResourceAction(formData: FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  await createShopResource({
    profileId: profile.id,
    kind: String(formData.get("kind") ?? "TECH") as SchedulerResourceKind,
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "") || undefined,
    capacityTotal: Number(formData.get("capacityTotal") || 0) || undefined,
  });
  bounce(formData);
}

export async function updateSchedulerResourceAction(formData: FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  await updateShopResource({
    profileId: profile.id,
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? ""),
    kind: String(formData.get("kind") ?? "TECH") as SchedulerResourceKind,
    capacityTotal: Number(formData.get("capacityTotal") || 0) || undefined,
  });
  bounce(formData);
}

export async function deleteSchedulerResourceAction(formData: FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  await deleteShopResource(profile.id, String(formData.get("id") ?? ""));
  bounce(formData);
}

export async function reorderSchedulerResourcesAction(formData: FormData) {
  const session = await requireMechanic();
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  await reorderShopResources(profile.id, ids);
  bounce(formData);
}
