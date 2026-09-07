"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { decideRepairGroup, submitAuthorization, createGroupedEstimate } from "@/services/repair-groups";
import { applyForVerification, setVerificationStatus, saveInspectionItem } from "@/services/verification";
import { audit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import type { ApprovalAction, InspectionKind, VerificationPipelineStatus, EstimateLineCategory } from "@prisma/client";

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function decideGroupAction(formData: FormData) {
  const session = await requireUser();
  await decideRepairGroup({
    groupId: String(formData.get("groupId")),
    customerId: session.id,
    action: String(formData.get("action")) as ApprovalAction,
  });
  revalidatePath(`/jobs/${String(formData.get("jobId"))}`);
}

export async function submitAuthorizationAction(formData: FormData) {
  const session = await requireUser();
  const headerStore = await headers();
  const result = await submitAuthorization({
    estimateId: String(formData.get("estimateId")),
    customerId: session.id,
    ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0] ?? undefined,
    userAgent: headerStore.get("user-agent") ?? undefined,
  });
  revalidatePath(`/jobs/${String(formData.get("jobId"))}`);
  redirect(`/jobs/${String(formData.get("jobId"))}?authorized=${result.totals.authorizedCents}`);
}

function lineCategory(value: string): EstimateLineCategory {
  if (value === "PARTS") return "PARTS";
  if (value === "LABOR") return "LABOR";
  if (value === "DIAGNOSTIC") return "DIAGNOSTIC";
  if (value === "SHOP_SUPPLIES" || value === "SUPPLIES") return "SUPPLIES";
  return "OTHER";
}

export async function createGroupedEstimateAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const rawGroups = formData.get("groups");
  let groups: { title: string; recommendation?: string; items: { category: EstimateLineCategory; description: string; quantity: number; unitCents: number }[] }[] = [];
  if (rawGroups) {
    const parsed = JSON.parse(String(rawGroups)) as {
      title: string;
      recommended?: boolean;
      lines: { description: string; kind: string; quantity: number; unitPrice: string }[];
    }[];
    groups = parsed
      .filter((group) => group.title.trim())
      .map((group) => ({
        title: group.title.trim(),
        recommendation: group.recommended === false ? "OPTIONAL" : "RECOMMENDED",
        items: (group.lines ?? [])
          .filter((line) => line.description.trim() && Number(line.unitPrice) >= 0)
          .map((line) => ({
            category: lineCategory(line.kind),
            description: line.description.trim(),
            quantity: Number(line.quantity) || 1,
            unitCents: Math.round(Number(line.unitPrice) * 100),
          })),
      }))
      .filter((group) => group.items.length);
  } else {
    const titles = formData.getAll("groupTitle").map(String).filter(Boolean);
    groups = titles
      .map((title, index) => {
        const descriptions = String(formData.get(`groupItems_${index}`) || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        return {
          title,
          items: descriptions.map((description) => {
            const [label, amount] = description.split("|").map((part) => part.trim());
            return {
              category: "LABOR" as EstimateLineCategory,
              description: label,
              quantity: 1,
              unitCents: Math.round(Number(amount || 0) * 100),
            };
          }),
        };
      })
      .filter((group) => group.items.length);
  }
  await createGroupedEstimate({
    jobId,
    mechanicId: session.id,
    type: formData.get("type") === "CHANGE_ORDER" ? "CHANGE_ORDER" : "PRIMARY",
    reason: String(formData.get("reason") || "") || undefined,
    groups,
  });
  revalidatePath(`/mechanic/jobs/${jobId}`);
}

export async function applyVerificationAction(formData: FormData) {
  const session = await requireUser();
  await applyForVerification(
    session.id,
    (String(formData.get("kind") || "MOBILE") as InspectionKind) || "MOBILE",
    String(formData.get("industryKey") || "AUTOMOTIVE"),
  );
  revalidatePath("/mechanic/profile");
  revalidatePath("/mechanic");
}

export async function hqVerificationAction(formData: FormData) {
  const session = await requireUser();
  const status = String(formData.get("status")) as VerificationPipelineStatus;
  const deciding = ["VERIFIED", "DENIED", "REVOKED", "SUSPENDED", "EXPIRED"].includes(status);
  if (deciding && !can(session.role, "verification.decide") && session.role !== "ADMIN") {
    throw new Error("Not authorized to change verification outcome.");
  }
  if (!deciding && !can(session.role, "verification.inspect") && !can(session.role, "verification.decide") && session.role !== "ADMIN") {
    throw new Error("Not authorized.");
  }
  await setVerificationStatus({
    applicationId: String(formData.get("applicationId")),
    actorId: session.id,
    status,
    reason: String(formData.get("reason") || "") || undefined,
    inspectorId: String(formData.get("inspectorId") || "") || undefined,
    scheduledAt: formData.get("scheduledAt") ? new Date(String(formData.get("scheduledAt"))) : undefined,
  });
  revalidatePath("/admin/verification");
  revalidatePath(`/admin/verification/${String(formData.get("applicationId"))}`);
}

export async function saveChecklistItemAction(formData: FormData) {
  const session = await requireUser();
  if (!can(session.role, "verification.inspect") && session.role !== "ADMIN") {
    throw new Error("Not authorized.");
  }
  const passedRaw = String(formData.get("passed") || "");
  await saveInspectionItem({
    itemId: String(formData.get("itemId")),
    actorId: session.id,
    score: formData.get("score") ? Number(formData.get("score")) : undefined,
    passed: passedRaw === "" ? undefined : passedRaw === "true",
    notes: String(formData.get("notes") || "") || undefined,
    notApplicable: formData.get("notApplicable") === "on",
  });
  revalidatePath(`/admin/verification/${String(formData.get("applicationId"))}`);
}

export async function addToCompareAction(formData: FormData) {
  const store = await cookies();
  const id = String(formData.get("mechanicProfileId"));
  const current = (store.get("pm_compare")?.value ?? "").split(",").filter(Boolean);
  if (!current.includes(id) && current.length < 3) current.push(id);
  store.set("pm_compare", current.join(","), { path: "/" });
  revalidatePath("/compare");
  revalidatePath("/mechanics");
}

export async function addInspectionFindingAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  if (job.mechanicUserId !== session.id) throw new Error("Not authorized.");
  let inspection = await prisma.vehicleInspection.findFirst({ where: { jobId } });
  if (!inspection) {
    inspection = await prisma.vehicleInspection.create({
      data: { jobId, vehicleId: job.vehicleId, assetId: job.assetId, mechanicUserId: session.id },
    });
  }
  await prisma.inspectionFinding.create({
    data: {
      inspectionId: inspection.id,
      section: String(formData.get("section")),
      status: String(formData.get("status")) as "GOOD" | "MONITOR" | "NEEDS_ATTENTION",
      explanation: String(formData.get("explanation") || "") || undefined,
      recommendation: String(formData.get("recommendation") || "") || undefined,
    },
  });
  revalidatePath(`/mechanic/jobs/${jobId}`);
}

export async function findingToEstimateGroupAction(formData: FormData) {
  const session = await requireUser();
  const jobId = String(formData.get("jobId"));
  const title = String(formData.get("title"));
  const amount = Math.round(Number(formData.get("amount") || 0) * 100);
  await createGroupedEstimate({
    jobId,
    mechanicId: session.id,
    type: "CHANGE_ORDER",
    reason: "Created from inspection finding.",
    groups: [
      {
        title,
        items: [{ category: "LABOR", description: title, quantity: 1, unitCents: amount }],
      },
    ],
  });
  revalidatePath(`/mechanic/jobs/${jobId}`);
}

export async function dismissRecommendedAction(formData: FormData) {
  const session = await requireUser();
  await prisma.recommendedWork.update({
    where: { id: String(formData.get("id")) },
    data: { status: "DISMISSED" },
  });
  await audit({ actorId: session.id, action: "recommended.dismissed", targetType: "recommendedWork", targetId: String(formData.get("id")) });
  revalidatePath("/mechanic/customers");
}
