import { getSession } from "@/lib/session";
import { ADMIN_NAV } from "@/components/layout/app-nav";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return children;
  return (
    <WorkspaceShell user={session} nav={ADMIN_NAV}>
      {children}
    </WorkspaceShell>
  );
}
