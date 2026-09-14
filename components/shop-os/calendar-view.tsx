import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ShopAutoSelect } from "@/components/shop-os/auto-select";
import { ShopDayBoard, ShopMonthBoard, ShopWeekBoard, UnscheduledChip } from "@/components/shop-os/boards";
import { ShopButton, ShopCard, ShopPageHeader, ShopSectionTitle } from "@/components/shop-os/primitives";
import { mechanicScheduleHref } from "@/lib/datetime";
import { formatCents } from "@/lib/money";
import type { SchedulerHoldCard, SchedulerJobCard, SchedulerReminder, SchedulerResourceCard, ScheduleView } from "@/lib/scheduler";
import { cn } from "@/lib/utils";
import type { BoardColumn } from "@/components/scheduler/calendar-views";
import type { BoardStats } from "@/components/scheduler/command-board";

export function ShopCalendar({
  view,
  date,
  dateLabel,
  prevDate,
  nextDate,
  todayDate,
  stats,
  resources,
  jobs,
  holds,
  columns,
  unscheduled,
  reminders,
  filters,
}: {
  view: ScheduleView;
  date: string;
  dateLabel: string;
  prevDate: string;
  nextDate: string;
  todayDate: string;
  stats: BoardStats;
  resources: SchedulerResourceCard[];
  jobs: SchedulerJobCard[];
  holds: SchedulerHoldCard[];
  columns: BoardColumn[];
  unscheduled: SchedulerJobCard[];
  reminders: SchedulerReminder[];
  filters: { resource?: string; type?: string; status?: string; q?: string };
}) {
  const href = (next: Partial<{ view: ScheduleView; date: string; resource: string; status: string }>) =>
    mechanicScheduleHref({
      view: next.view ?? view,
      date: next.date ?? date,
      resource: next.resource ?? filters.resource,
      status: next.status ?? filters.status,
      q: filters.q,
    });

  const awaiting = [...jobs, ...unscheduled].filter((job) => job.status === "AWAITING_APPROVAL");
  const unassigned = [...jobs, ...unscheduled].filter((job) => !job.resourceId);
  const dropOffs = jobs.filter((job) => job.scheduledAt).slice(0, 6);
  const techs = resources.filter((item) => item.kind === "TECH" || item.kind === "MOBILE");

  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="Scheduler"
        subtitle="Manage technicians, appointments, and shop capacity."
        actions={
          <>
            <div className="inline-flex items-center rounded-xl border border-[#e6eef6] bg-white p-1">
              {(["day", "week", "month"] as const).map((item) => (
                <Link
                  key={item}
                  href={href({ view: item })}
                  className={cn(
                    "h-8 rounded-lg px-3 text-[13px] font-semibold capitalize",
                    view === item ? "bg-[#2f7bff] text-white" : "text-[#5c6b7a]",
                  )}
                >
                  {item}
                </Link>
              ))}
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl border border-[#e6eef6] bg-white px-1">
              <Link href={href({ date: prevDate })} className="inline-flex h-8 w-8 items-center justify-center text-[#5c6b7a]">
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <span className="min-w-[148px] text-center text-[13px] font-bold text-[#102033]">{dateLabel}</span>
              <Link href={href({ date: nextDate })} className="inline-flex h-8 w-8 items-center justify-center text-[#5c6b7a]">
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <ShopButton href={href({ date: todayDate })} variant="secondary">
              Today
            </ShopButton>
            <ShopButton href="/mechanic/jobs/new">
              <Plus className="h-4 w-4" /> Add Job
            </ShopButton>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <ShopAutoSelect
          name="resource"
          action="/mechanic/schedule"
          hidden={{ view, date, status: filters.status, q: filters.q }}
          value={filters.resource ?? ""}
          options={[{ value: "", label: "All Techs" }, ...techs.map((item) => ({ value: item.id, label: item.name }))]}
        />
        <ShopAutoSelect
          name="status"
          action="/mechanic/schedule"
          hidden={{ view, date, resource: filters.resource, q: filters.q }}
          value={filters.status ?? ""}
          options={[
            { value: "", label: "All Statuses" },
            { value: "IN_PROGRESS", label: "In Progress" },
            { value: "AWAITING_APPROVAL", label: "Waiting on Approval" },
            { value: "SCHEDULED", label: "Scheduled" },
            { value: "COMPLETED", label: "Completed" },
          ]}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <ShopCard className="overflow-hidden p-3">
            {view === "month" ? (
              <ShopMonthBoard columns={columns} jobs={jobs} />
            ) : view === "week" ? (
              <ShopWeekBoard date={date} columns={columns} resources={resources} jobs={jobs} holds={holds} />
            ) : (
              <ShopDayBoard date={date} resources={resources} jobs={jobs} holds={holds} />
            )}
          </ShopCard>
          <div className="grid gap-4 lg:grid-cols-3">
            <ShopCard>
              <ShopSectionTitle title={`Unscheduled Jobs (${unscheduled.length})`} />
              <div className="space-y-2 px-4 pb-4">
                {unscheduled.length === 0 ? (
                  <p className="py-4 text-sm text-[#6b7c8d]">Everything on the board has a time.</p>
                ) : (
                  unscheduled.map((job) => <UnscheduledChip key={job.id} job={job} />)
                )}
              </div>
            </ShopCard>
            <ShopCard>
              <ShopSectionTitle title="Recent Schedule Changes" href="/mechanic/jobs" />
              <div className="space-y-2 px-4 pb-4">
                {reminders.length === 0 ? (
                  <p className="py-4 text-sm text-[#6b7c8d]">No recent changes.</p>
                ) : (
                  reminders.slice(0, 6).map((item) => (
                    <Link key={item.id} href={item.href} className="block rounded-xl bg-[#f8fafc] px-3 py-2">
                      <p className="text-[13px] font-semibold text-[#102033]">{item.title}</p>
                      <p className="text-[11px] text-[#6b7c8d]">{item.detail}</p>
                    </Link>
                  ))
                )}
              </div>
            </ShopCard>
            <ShopCard className="p-4">
              <p className="text-[15px] font-bold text-[#102033]">Shop Performance</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#6b7c8d]">Appointments</dt>
                  <dd className="font-bold">{stats.appointments}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6b7c8d]">In Progress</dt>
                  <dd className="font-bold">{stats.inProgress}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6b7c8d]">On time</dt>
                  <dd className="font-bold">{stats.onTimePct}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6b7c8d]">Booked revenue</dt>
                  <dd className="font-bold">{formatCents(stats.revenueCents)}</dd>
                </div>
              </dl>
            </ShopCard>
          </div>
        </div>
        <div className="space-y-4">
          <ShopCard>
            <ShopSectionTitle title="Upcoming Drop-Offs" href="/mechanic/jobs" />
            <SideList
              items={dropOffs.map((job) => ({
                href: job.href,
                title: job.vehicleLabel,
                detail: `${job.customerFullName} · ${job.timeLabel ?? "TBD"}`,
                chip: "Drop-Off",
              }))}
              empty="Nothing on the book."
            />
          </ShopCard>
          <ShopCard>
            <ShopSectionTitle title="Waiting on Approval" href="/mechanic/estimates" />
            <SideList
              items={awaiting.map((job) => ({
                href: `/mechanic/jobs?job=${job.id}`,
                title: job.vehicleLabel,
                detail: job.customerFullName,
                chip: "Pending",
              }))}
              empty="No estimates waiting."
            />
          </ShopCard>
          <ShopCard>
            <ShopSectionTitle title="Unassigned Jobs" href="/mechanic/jobs" />
            <SideList
              items={unassigned.map((job) => ({
                href: `/mechanic/jobs?job=${job.id}`,
                title: job.title,
                detail: job.vehicleLabel,
                chip: "Unassigned",
              }))}
              empty="Every job has a tech."
            />
          </ShopCard>
          <ShopCard className="p-4">
            <p className="text-[15px] font-bold text-[#102033]">Capacity / Utilization</p>
            <div className="mt-3 space-y-2">
              {techs.map((resource) => {
                const used = jobs.filter((job) => job.resourceId === resource.id).length;
                const pct = Math.min(100, Math.round((used / Math.max(resource.capacityTotal, 1)) * 100));
                return (
                  <div key={resource.id}>
                    <div className="flex justify-between text-[12px] font-semibold">
                      <span>{resource.name}</span>
                      <span className="text-[#6b7c8d]">{pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#eef3f8]">
                      <div className="h-full rounded-full bg-[#2f7bff]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ShopCard>
        </div>
      </div>
    </div>
  );
}

function SideList({
  items,
  empty,
}: {
  items: { href: string; title: string; detail: string; chip: string }[];
  empty: string;
}) {
  if (items.length === 0) return <p className="px-4 pb-4 text-sm text-[#6b7c8d]">{empty}</p>;
  return (
    <div className="space-y-1 px-3 pb-3">
      {items.slice(0, 5).map((item) => (
        <Link key={item.href + item.title} href={item.href} className="flex items-start justify-between gap-2 rounded-xl px-2 py-2 hover:bg-[#f8fafc]">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[#102033]">{item.title}</p>
            <p className="truncate text-[11px] text-[#6b7c8d]">{item.detail}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#eef3f8] px-2 py-0.5 text-[10px] font-semibold text-[#5c6b7a]">{item.chip}</span>
        </Link>
      ))}
    </div>
  );
}

