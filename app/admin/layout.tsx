import { getSession } from "@/lib/session";
import { ADMIN_NAV } from "@/components/layout/app-nav";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { unreadNotificationCount } from "@/services/notifications";
import { unreadMessageCount } from "@/services/messages";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return children;
  const [unreadNotifications, unreadMessages] = await Promise.all([
    unreadNotificationCount(session.id),
    unreadMessageCount(session.id, session.role),
  ]);
  return (
    <WorkspaceShell
      user={session}
      nav={ADMIN_NAV}
      product="admin"
      workspace="Platform"
      unreadNotifications={unreadNotifications}
      unreadMessages={unreadMessages}
    >
      {children}
    </WorkspaceShell>
  );
}
