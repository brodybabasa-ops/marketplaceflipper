import type { UserRole } from "@prisma/client";

export type Permission =
  | "hq.access"
  | "verification.inspect"
  | "verification.decide"
  | "finance.manage"
  | "fees.edit"
  | "roles.edit"
  | "refund.large"
  | "support.work";

const ROLE_PERMS: Record<UserRole, Permission[] | "*"> = {
  ADMIN: "*",
  INSPECTOR: ["hq.access", "verification.inspect"],
  SUPPORT: ["hq.access", "support.work"],
  FINANCE: ["hq.access", "finance.manage"],
  CUSTOMER: [],
  MECHANIC: [],
};

export function can(role: UserRole, permission: Permission) {
  const granted = ROLE_PERMS[role];
  if (granted === "*") return true;
  return granted.includes(permission);
}

export function staffRoles(): UserRole[] {
  return ["ADMIN", "INSPECTOR", "SUPPORT", "FINANCE"];
}
