import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ShopHoursForm } from "@/components/jobs/shop-hours-form";
import { BoardSettings } from "@/components/scheduler/board-settings";
import { TeamSettings } from "@/components/scheduler/team-settings";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { parseBoardLayout } from "@/lib/board-layout";
import { cn } from "@/lib/utils";
import { ensureSchedulerResources } from "@/services/scheduler";

export const metadata = { title: "Settings" };

export default async function MechanicSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "team" || tabParam === "board" ? tabParam : "hours";
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true },
  });
  const resources = await ensureSchedulerResources(profile.id);
  const returnTo = `/mechanic/settings?tab=${tab}`;
  const layout = parseBoardLayout(profile.schedulerLayout);

  return (
    <div className="space-y-4">
      <nav className="inline-flex rounded-lg border border-white/10 bg-[#0d1c2e] p-1">
        {[
          { id: "hours", label: "Hours" },
          { id: "team", label: "Team" },
          { id: "board", label: "Board" },
        ].map((item) => (
          <Link
            key={item.id}
            href={`/mechanic/settings?tab=${item.id}`}
            className={cn(
              "inline-flex h-9 items-center rounded-md px-4 text-sm font-semibold",
              tab === item.id ? "bg-[#2f7bff] text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "hours" ? (
        <Card className="border-0 p-5">
          <h2 className="font-semibold text-navy">Shop hours</h2>
          <p className="mt-1 text-sm text-muted">These hours show on the scheduler. Closed days stay off the book.</p>
          <div className="mt-4">
            <ShopHoursForm hours={profile.availability} />
          </div>
        </Card>
      ) : null}

      {tab === "team" ? (
        <TeamSettings
          resources={resources.map((item) => ({
            id: item.id,
            kind: item.kind,
            name: item.name,
            role: item.role ?? "",
            capacityTotal: item.capacityTotal,
            sortOrder: item.sortOrder,
          }))}
          returnTo={returnTo}
        />
      ) : null}

      {tab === "board" ? <BoardSettings layout={layout} returnTo={returnTo} /> : null}

      {tab === "hours" ? (
        <Card className="border-0 p-5 text-sm text-muted">
          Shop hours above control the book. Add technicians on Team. Turn the map, parts, and other panels on or off on
          Board — or drag them on the scheduler itself.
        </Card>
      ) : null}
    </div>
  );
}
