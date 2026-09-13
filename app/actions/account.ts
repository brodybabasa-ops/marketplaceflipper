"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/session";
import { accountSchema } from "@/lib/validations";
import { hashPassword, verifyPassword } from "@/services/auth";

export type AccountState = { error?: string; saved?: boolean };

export async function updateAccountAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const parsed = accountSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    zip: formData.get("zip"),
    currentPassword: String(formData.get("currentPassword") ?? "") || undefined,
    newPassword: String(formData.get("newPassword") ?? "") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) return { error: "Enter your current password to set a new one." };
    const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return { error: "Current password is incorrect." };
  }

  const zipDigits = parsed.data.zip.slice(0, 5);
  const zip = await prisma.zipCode.findUnique({ where: { zip: zipDigits } });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      phone: parsed.data.phone,
      ...(parsed.data.newPassword ? { passwordHash: await hashPassword(parsed.data.newPassword) } : {}),
    },
  });

  if (session.role === "CUSTOMER") {
    await prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {
        zip: zipDigits,
        city: zip?.city ?? undefined,
        state: zip?.stateCode ?? undefined,
        latitude: zip?.latitude ?? undefined,
        longitude: zip?.longitude ?? undefined,
      },
      create: {
        userId: user.id,
        zip: zipDigits,
        city: zip?.city,
        state: zip?.stateCode,
        latitude: zip?.latitude,
        longitude: zip?.longitude,
      },
    });
  }

  await setSessionCookie({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: parsed.data.firstName.trim(),
    lastName: parsed.data.lastName.trim(),
  });

  revalidatePath("/account");
  revalidatePath("/home");
  revalidatePath("/request");
  return { saved: true };
}
