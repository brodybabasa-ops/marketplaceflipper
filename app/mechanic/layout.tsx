import { getSession } from "@/lib/session";
import { MECHANIC_NAV } from "@/components/layout/app-nav";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { prisma } from "@/lib/db";
import { unreadNotificationCount } from "@/services/notifications";
import { unreadMessageCount } from "@/services/messages";

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "MECHANIC") return children;
  const [profile, unreadNotifications, unreadMessages] = await Promise.all([
    prisma.mechanicProfile.findUnique({
      where: { userId: session.id },
      select: { businessName: true },
    }),
    unreadNotificationCount(session.id),
    unreadMessageCount(session.id, session.role),
  ]);
  return (
    <WorkspaceShell
      user={session}
      nav={MECHANIC_NAV}
      product="shop"
      workspace={profile?.businessName ?? "Shop"}
      unreadNotifications={unreadNotifications}
      unreadMessages={unreadMessages}
    >
      {children}
    </WorkspaceShell>
  );
}
