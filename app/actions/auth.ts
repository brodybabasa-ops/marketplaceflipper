"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { signInSchema, signUpSchema } from "@/lib/validations";
import { createUser, findUserByEmail, verifyPassword } from "@/services/auth";
import { clearSessionCookie, homeForRole, safeInternalPath, setSessionCookie } from "@/lib/session";

export type AuthState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Check the highlighted fields." };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || user.status !== "ACTIVE") {
    return { error: "We couldn’t find an active account with those details." };
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "We couldn’t find an active account with those details." };
  }

  const headerStore = await headers();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: headerStore.get("x-forwarded-for")?.split(",")[0] ?? headerStore.get("x-real-ip"),
    },
  });

  await setSessionCookie({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  redirect(safeInternalPath(formData.get("next")) ?? homeForRole(user.role));
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ?? "CUSTOMER",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Check the highlighted fields." };
  }

  try {
    const user = await createUser(parsed.data);
    await setSessionCookie({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    redirect(user.role === "MECHANIC" ? "/mechanic/onboarding" : "/home");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create that account." };
  }
}

export async function signOutAction() {
  await clearSessionCookie();
  redirect("/");
}
