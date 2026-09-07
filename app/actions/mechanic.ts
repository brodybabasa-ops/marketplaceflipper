"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guards";
import { mechanicOnboardingSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { attachProviderIndustries } from "@/services/assets";

export async function saveMechanicProfileAction(formData: FormData) {
  const session = await requireSession("MECHANIC");
  const parsed = mechanicOnboardingSchema.safeParse({
    businessName: formData.get("businessName"),
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
    industryKeys: formData.getAll("industryKey").map(String).filter(Boolean),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check your profile details.");
  const zip = await prisma.zipCode.findUnique({ where: { zip: parsed.data.shopZip.slice(0, 5) } });
  const slug = slugify(parsed.data.businessName);
  const { industryKeys, ...profileData } = parsed.data;
  const profile = await prisma.mechanicProfile.update({
    where: { userId: session.id },
    data: {
      ...profileData,
      slug,
      startingPriceCents: parsed.data.diagnosticPriceCents,
      latitude: zip?.latitude ?? 40.7608,
      longitude: zip?.longitude ?? -111.891,
      profileCompletePct: 100,
      onboardingStep: 13,
    },
  });
  await attachProviderIndustries(profile.id, industryKeys?.length ? industryKeys : ["AUTOMOTIVE"]);
  revalidatePath("/mechanic");
  redirect("/mechanic");
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
