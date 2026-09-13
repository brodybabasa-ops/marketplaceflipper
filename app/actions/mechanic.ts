"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guards";
import { mechanicOnboardingSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { safeInternalPath } from "@/lib/session-token";

export async function saveMechanicProfileAction(formData: FormData) {
  const session = await requireSession("MECHANIC");
  const parsed = mechanicOnboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    tagline: String(formData.get("tagline") ?? "").trim() || undefined,
    bio: formData.get("bio"),
    yearsExperience: formData.get("yearsExperience"),
    serviceMode: formData.get("serviceMode"),
    shopCity: formData.get("shopCity"),
    shopState: formData.get("shopState"),
    shopZip: formData.get("shopZip"),
    serviceRadiusMiles: formData.get("serviceRadiusMiles"),
    diagnosticPriceCents: Math.round(Number(formData.get("diagnosticPrice") ?? 0) * 100),
    laborRateCents: Math.round(Number(formData.get("laborRate") ?? 0) * 100),
    mobileFeeCents: Math.round(Number(formData.get("mobileFee") ?? 0) * 100),
    acceptsNewJobs: formData.get("acceptsNewJobs") === "on",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check your profile details.");
  const zip = await prisma.zipCode.findUnique({ where: { zip: parsed.data.shopZip.slice(0, 5) } });
  const existing = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const slug = existing.slug || slugify(parsed.data.businessName);
  await prisma.mechanicProfile.update({
    where: { userId: session.id },
    data: {
      ...parsed.data,
      slug,
      startingPriceCents: parsed.data.diagnosticPriceCents,
      latitude: zip?.latitude ?? existing.latitude,
      longitude: zip?.longitude ?? existing.longitude,
      profileCompletePct: 100,
      onboardingStep: 13,
    },
  });
  const next = safeInternalPath(formData.get("next")) ?? "/mechanic";
  revalidatePath("/mechanic");
  revalidatePath("/mechanic/profile");
  revalidatePath("/mechanic/onboarding");
  revalidatePath(`/mechanics/${slug}`);
  redirect(next);
}

export async function submitVerificationAction() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  await prisma.verification.create({
    data: {
      mechanicProfileId: profile.id,
      level: "PROFILE_VERIFIED",
      status: "PENDING",
    },
  });
  revalidatePath("/mechanic/profile");
}

export async function saveAvailabilityAction(formData: FormData) {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
  await prisma.$transaction(
    days.map((dayOfWeek) => {
      const closed = formData.get(`${dayOfWeek}-closed`) === "on";
      const startTime = String(formData.get(`${dayOfWeek}-start`) ?? "08:00");
      const endTime = String(formData.get(`${dayOfWeek}-end`) ?? "18:00");
      if (closed) {
        return prisma.mechanicAvailability.deleteMany({
          where: { mechanicProfileId: profile.id, dayOfWeek },
        });
      }
      return prisma.mechanicAvailability.upsert({
        where: { mechanicProfileId_dayOfWeek: { mechanicProfileId: profile.id, dayOfWeek } },
        update: { startTime, endTime },
        create: { mechanicProfileId: profile.id, dayOfWeek, startTime, endTime },
      });
    }),
  );
  revalidatePath("/mechanic/settings");
  revalidatePath("/mechanic/schedule");
  revalidatePath("/mechanic");
}
