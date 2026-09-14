import { ShopSettingsView } from "@/components/shop-os/settings-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { parseBoardLayout } from "@/lib/board-layout";
import { ensureSchedulerResources } from "@/services/scheduler";

export const metadata = { title: "Settings" };

export default async function MechanicSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "team" || tabParam === "board" ? "team" : tabParam ?? "general";
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true },
  });
  const resources = await ensureSchedulerResources(profile.id);
  return (
    <ShopSettingsView
      tab={tab === "board" ? "appearance" : tab}
      profile={profile}
      resources={resources.map((item) => ({
        id: item.id,
        kind: item.kind,
        name: item.name,
        role: item.role ?? "",
        capacityTotal: item.capacityTotal,
        sortOrder: item.sortOrder,
      }))}
      layout={parseBoardLayout(profile.schedulerLayout)}
    />
  );
}
