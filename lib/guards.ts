import { redirect } from "next/navigation";
import { getSession, type SessionUser, homeForRole } from "@/lib/session";
import type { UserRole } from "@prisma/client";

export async function requireSession(role?: UserRole | UserRole[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(session.role)) {
      redirect(`/forbidden?from=${encodeURIComponent(homeForRole(session.role))}`);
    }
  }
  return session;
}
