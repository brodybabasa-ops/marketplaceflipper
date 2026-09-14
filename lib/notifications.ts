import type { UserRole } from "@prisma/client";

export function notificationsPath(role: UserRole) {
  if (role === "MECHANIC") return "/mechanic/notifications";
  if (role === "ADMIN") return "/admin/notifications";
  return "/notifications";
}
