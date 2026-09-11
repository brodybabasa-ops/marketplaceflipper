import { getSession } from "@/lib/session";
import { MECHANIC_NAV } from "@/components/layout/app-nav";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "MECHANIC") return children;
  return (
    <WorkspaceShell user={session} nav={MECHANIC_NAV}>
      {children}
    </WorkspaceShell>
  );
}
