import type { SessionUser } from "@/lib/session";
import type { UserRole } from "@prisma/client";

export type { SessionUser };

export type CurrentUser = SessionUser & {
  role: UserRole;
};
