import { ShopTeamView } from "@/components/shop-os/list-pages";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { ensureSchedulerResources } from "@/services/scheduler";

export const metadata = { title: "Team" };

export default async function MechanicTeamPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const resources = await ensureSchedulerResources(profile.id);
  return (
    <ShopTeamView
      resources={resources.map((item) => ({
        id: item.id,
        kind: item.kind,
        name: item.name,
        role: item.role ?? "",
        capacityTotal: item.capacityTotal,
        sortOrder: item.sortOrder,
      }))}
    />
  );
}
