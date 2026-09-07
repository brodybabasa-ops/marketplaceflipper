import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "pm_session";
export const SESSION_DURATION = 60 * 60 * 24 * 14;

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(value);
}

export async function encryptSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .setSubject(user.id)
    .sign(secret());
}

export async function decryptSession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      id: payload.sub,
      email: String(payload.email),
      role: payload.role as UserRole,
      firstName: String(payload.firstName ?? ""),
      lastName: String(payload.lastName ?? ""),
    };
  } catch {
    return null;
  }
}

export function homeForRole(role: UserRole) {
  if (role === "MECHANIC") return "/mechanic";
  if (role === "ADMIN" || role === "INSPECTOR" || role === "SUPPORT" || role === "FINANCE") return "/admin";
  return "/home";
}
