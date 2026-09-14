import Link from "next/link";
import { Plus, Wrench } from "lucide-react";
import {
  AppCard,
  AppPageHeader,
  FilterTabs,
  GhostCta,
  ProgressTrack,
  SolidCta,
  StatusBadge,
  VerifiedMark,
} from "@/components/customer-app/primitives";
import type { RepairRow, RepairTab } from "@/services/customer-repairs";

const TABS: { id: RepairTab | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In Progress" },
  { id: "waiting-parts", label: "Waiting on Parts" },
  { id: "completed", label: "Completed" },
];

export function CustomerRepairsView({
  rows,
  counts,
  activeTab,
}: {
  rows: RepairRow[];
  counts: Record<RepairTab, number>;
  activeTab: RepairTab;
}) {
  const visible =
    activeTab === "all"
      ? rows.filter((row) => row.tab !== "cancelled")
      : activeTab === "in-progress"
        ? rows.filter((row) => row.tab === "in-progress" || row.tab === "waiting-approval")
        : rows.filter((row) => row.tab === activeTab);

  const tabCounts = {
    all: counts.all - counts.cancelled,
    "in-progress": counts["in-progress"] + counts["waiting-approval"],
    "waiting-parts": counts["waiting-parts"],
    completed: counts.completed,
  };

  return (
    <div className="px-4 pt-2">
      <AppPageHeader title="My Repairs" subtitle="Track, manage, and stay updated on all your repairs." />
      <FilterTabs
        value={activeTab === "waiting-approval" ? "in-progress" : activeTab}
        tabs={TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: tabCounts[tab.id as keyof typeof tabCounts],
        }))}
      />
      <div className="mt-4 space-y-3">
        {visible.map((row) => (
          <AppCard key={row.id} href={row.href} className="p-3">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.photo} alt="" className="h-[72px] w-[88px] shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold text-white">{row.vehicleLabel}</p>
                    <p className="truncate text-xs text-white/55">{row.problem}</p>
                  </div>
                  <StatusBadge label={row.badge.label} tone={row.badge.tone} />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.shopPhoto} alt="" className="h-5 w-5 rounded-full object-cover" />
                  <span className="truncate font-semibold text-white/70">{row.shopName}</span>
                  <VerifiedMark className="h-3 w-3" />
                </div>
                <p className="mt-1 text-[11px] text-white/40">{row.startedLabel}</p>
              </div>
            </div>
            {row.showTracker ? <ProgressTrack steps={row.steps} index={row.stepIndex} /> : null}
            {row.tab === "completed" ? (
              <div className="mt-3 flex justify-end">
                <span className="text-sm font-semibold text-[#7eb0ff]">View Invoice</span>
              </div>
            ) : null}
          </AppCard>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <GhostCta href="/request" icon={<Plus className="h-5 w-5" />} title="Start a New Repair" body="Get an estimate, find a shop, or ask a question." />
        <SolidCta href="/messages" icon={<Wrench className="h-5 w-5" />} title="Need help with a repair?" body="Message your shop, upload photos, or ask a question." />
      </div>
    </div>
  );
}
