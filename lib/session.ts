import { cookies } from "next/headers";
import {
  decryptSession,
  encryptSession,
  homeForRole,
  safeInternalPath,
  SESSION_COOKIE,
  SESSION_DURATION,
  type SessionUser,
} from "@/lib/session-token";

export { decryptSession, encryptSession, homeForRole, safeInternalPath, SESSION_COOKIE, type SessionUser };

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function setSessionCookie(user: SessionUser) {
  const token = await encryptSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
