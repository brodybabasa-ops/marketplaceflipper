import { getSession } from "@/lib/session";
import { MECHANIC_NAV } from "@/components/layout/app-nav";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { prisma } from "@/lib/db";

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "MECHANIC") return children;
  const profile = await prisma.mechanicProfile.findUnique({
    where: { userId: session.id },
    select: { businessName: true },
  });
  return (
    <WorkspaceShell user={session} nav={MECHANIC_NAV} product="shop" workspace={profile?.businessName ?? "Shop"}>
      {children}
    </WorkspaceShell>
  );
}
