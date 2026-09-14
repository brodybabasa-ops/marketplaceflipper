"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  DollarSign,
  Package,
  Plus,
  Search,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";
import { createShopRepairOrderAction, scheduleAppointmentAction } from "@/app/actions/marketplace";
import { createSchedulerBlockAction, optimizeScheduleAction, swapScheduleJobsAction } from "@/app/actions/scheduler";
import {
  CustomizeBar,
  HiddenPalette,
  TrashZone,
  WidgetChrome,
  WidgetDropZone,
  useBoardLayout,
} from "@/components/scheduler/board-layout";
import { CalendarViews, type BoardColumn } from "@/components/scheduler/calendar-views";
import { DayGantt } from "@/components/scheduler/day-gantt";
import { moveWidget, restoreWidget, type BoardWidgetId, type BoardZone, type SchedulerBoardLayout } from "@/lib/board-layout";
import { mechanicScheduleHref } from "@/lib/datetime";
import {
  formatUsd,
  mapsRouteUrl,
  statusChip,
  unscheduledPriority,
  type SchedulerHoldCard,
  type SchedulerJobCard,
  type SchedulerPartArrival,
  type SchedulerReminder,
  type SchedulerResourceCard,
  type ScheduleView,
} from "@/lib/scheduler";
import { cn } from "@/lib/utils";

export type BoardStats = {
  appointments: number;
  appointmentsDelta: number;
  inProgress: number;
  waitingOnParts: number;
  behind: number;
  revenueCents: number;
  onTimePct: number;
};

export type CalendarDay = { date: string; inMonth: boolean; count: number };
export type CustomerOption = {
  id: string;
  name: string;
  vehicles: { id: string; label: string }[];
};

export function CommandBoard({
  view,
  date,
  dateLabel,
  prevDate,
  nextDate,
  todayDate,
  monthLabel,
  shopName,
  shopCity,
  shopState,
  origin,
  stats,
  resources,
  jobs,
  holds,
  columns,
  unscheduled,
  reminders,
  parts,
  calendarDays,
  movingJobId,
  panel,
  filters,
  customers,
  layout: initialLayout,
  customize = false,
}: {
  view: ScheduleView;
  date: string;
  dateLabel: string;
  prevDate: string;
  nextDate: string;
  todayDate: string;
  monthLabel: string;
  shopName: string;
  shopCity: string;
  shopState: string;
  origin: { latitude: number; longitude: number; label: string };
  stats: BoardStats;
  resources: SchedulerResourceCard[];
  jobs: SchedulerJobCard[];
  holds: SchedulerHoldCard[];
  columns: BoardColumn[];
  unscheduled: SchedulerJobCard[];
  reminders: SchedulerReminder[];
  parts: SchedulerPartArrival[];
  calendarDays: CalendarDay[];
  movingJobId?: string;
  panel?: string;
  filters: { resource?: string; type?: string; status?: string; mode?: string; q?: string };
  customers: CustomerOption[];
  layout: SchedulerBoardLayout;
  customize?: boolean;
}) {
  const [query, setQuery] = useState(filters.q ?? "");
  const { layout, persist, pending } = useBoardLayout(initialLayout);
  const moving = movingJobId ? jobs.concat(unscheduled).find((job) => job.id === movingJobId) : undefined;
  const hrefBase = {
    view,
    date,
    moving: movingJobId,
    resource: filters.resource,
    type: filters.type,
    status: filters.status,
    mode: filters.mode,
    q: filters.q,
    customize: customize || undefined,
  };
  const returnTo = mechanicScheduleHref({ view, date, moving: movingJobId, customize });
  const jobMap = useMemo(() => Object.fromEntries(jobs.concat(unscheduled).map((job) => [job.id, job])), [jobs, unscheduled]);
  const visibleJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filters.resource && job.resourceId !== filters.resource) return false;
      if (filters.type && job.category !== filters.type) return false;
      if (filters.status && job.status !== filters.status) return false;
      if (filters.mode === "shop" && job.mobile) return false;
      if (filters.mode === "mobile" && !job.mobile) return false;
      const hay = `${job.title} ${job.customerFullName} ${job.vehicleLabel}`.toLowerCase();
      if (filters.q && !hay.includes(filters.q.toLowerCase())) return false;
      return true;
    });
  }, [jobs, filters]);
  const agenda = visibleJobs.filter((job) => job.scheduledAt).sort((a, b) => (a.time > b.time ? 1 : -1));
  const roadStops = agenda.filter((job) => job.mobile && job.latitude != null && job.longitude != null);
  const showRail = customize || layout.rail.length > 0;
  const dockCols =
    layout.dock.length >= 4
      ? "lg:grid-cols-4"
      : layout.dock.length === 3
        ? "lg:grid-cols-3"
        : layout.dock.length === 2
          ? "lg:grid-cols-2"
          : "lg:grid-cols-1";

  function place(id: BoardWidgetId, zone: BoardZone, beforeId?: BoardWidgetId) {
    persist(moveWidget(layout, id, zone, beforeId ? { before: beforeId } : undefined));
  }

  function widget(id: BoardWidgetId, zone: BoardZone) {
    const compact = zone === "rail";
    const body =
      id === "stats" ? (
        <StatsRow stats={stats} compact={compact} />
      ) : id === "filters" ? (
        <FiltersForm
          view={view}
          date={date}
          movingJobId={movingJobId}
          customize={customize}
          filters={filters}
          resources={resources}
          jobs={jobs}
          query={query}
          setQuery={setQuery}
        />
      ) : id === "calendar" ? (
        <MiniCalendar monthLabel={monthLabel} days={calendarDays} selected={date} movingJobId={movingJobId} />
      ) : id === "agenda" ? (
        <AgendaPanel date={date} agenda={agenda} />
      ) : id === "map" ? (
        <MapPanel origin={origin} roadStops={roadStops} shopName={shopName} shopCity={shopCity} shopState={shopState} />
      ) : id === "unscheduled" ? (
        <UnscheduledPanel date={date} view={view} unscheduled={unscheduled} />
      ) : id === "parts" ? (
        <PartsPanel parts={parts} />
      ) : id === "reminders" ? (
        <RemindersPanel reminders={reminders} />
      ) : (
        <QuickActionsPanel date={date} view={view} resources={resources} jobs={agenda} movingJobId={movingJobId} returnTo={returnTo} />
      );
    return (
      <WidgetChrome key={id} id={id} zone={zone} customize={customize} onPlace={place}>
        {body}
      </WidgetChrome>
    );
  }

  return (
    <div data-command-board data-customize={customize ? "1" : "0"} className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Schedule</h1>
          <p className="mt-1 text-sm text-white/50">Your day. Your team. Maximum productivity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-white/10 bg-[#0d1c2e] p-1">
            {(["day", "week", "month"] as ScheduleView[]).map((item) => (
              <Link
                key={item}
                href={mechanicScheduleHref({ ...hrefBase, view: item })}
                className={cn(
                  "inline-flex h-8 items-center rounded-md px-3 text-sm font-semibold capitalize",
                  view === item ? "bg-[#2f7bff] text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
                )}
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0d1c2e] p-1">
            <Link href={mechanicScheduleHref({ ...hrefBase, date: prevDate })} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/5" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <p className="min-w-[9.5rem] px-2 text-center text-sm font-semibold text-white">{dateLabel}</p>
            <Link href={mechanicScheduleHref({ ...hrefBase, date: nextDate })} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/5" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <Link href={mechanicScheduleHref({ ...hrefBase, date: todayDate })} className="inline-flex h-9 items-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/80 hover:bg-white/5">
            Today
          </Link>
          <Link
            href={mechanicScheduleHref({ ...hrefBase, panel: "schedule" })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2f7bff] px-3 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Schedule Appointment
          </Link>
          <form action={optimizeScheduleAction}>
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="returnTo" value={mechanicScheduleHref({ view, date, customize })} />
            <button type="submit" name="optimizeDay" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1f6feb] px-3 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4" />
              Optimize Day
            </button>
          </form>
          <Link
            href="/mechanic/settings?tab=team"
            className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-sm font-semibold text-white/80 hover:bg-white/5"
          >
            Team
          </Link>
          <CustomizeBar
            active={customize}
            pending={pending}
            startHref={mechanicScheduleHref({ ...hrefBase, customize: true })}
            doneHref={mechanicScheduleHref({ ...hrefBase, customize: false })}
            resetTo={mechanicScheduleHref({ ...hrefBase, customize: true })}
          />
        </div>
      </header>

      {customize ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
          <TrashZone customize onPlace={(id) => place(id, "hidden")} />
          <HiddenPalette layout={layout} customize onRestore={(id) => persist(restoreWidget(layout, id))} />
        </div>
      ) : null}

      {customize || layout.top.length > 0 ? (
        <WidgetDropZone
          zone="top"
          customize={customize}
          onPlace={place}
          empty={layout.top.length === 0}
          emptyLabel="Drop day stats or filters here."
          className="space-y-3"
        >
          {layout.top.map((id) => widget(id, "top"))}
        </WidgetDropZone>
      ) : null}

      <div className={showRail ? "grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]" : ""}>
        <div className="min-w-0 space-y-4">
          {moving ? (
            <p className="text-sm text-[#7eb0ff]">
              Moving {moving.title} for {moving.customerName}. Park on a lane and hour, or drop the block.
            </p>
          ) : null}
          {view === "day" ? (
            <DayGantt
              date={date}
              view={view}
              resources={resources}
              jobs={[...visibleJobs, ...unscheduled]}
              holds={holds}
              movingJobId={movingJobId}
              origin={origin}
              showRoute={layout.showRoute}
              locked={customize}
            />
          ) : (
            <CalendarViews view={view} date={date} jobs={jobMap} columns={columns} movingJobId={movingJobId} />
          )}
        </div>
        {showRail ? (
          <aside className="space-y-3">
            <WidgetDropZone
              zone="rail"
              customize={customize}
              onPlace={place}
              empty={layout.rail.length === 0}
              emptyLabel="Drop calendar, agenda, or the map here."
              className="space-y-3"
            >
              {layout.rail.map((id) => widget(id, "rail"))}
            </WidgetDropZone>
          </aside>
        ) : null}
      </div>

      {customize || layout.dock.length > 0 ? (
        <WidgetDropZone
          zone="dock"
          customize={customize}
          onPlace={place}
          empty={layout.dock.length === 0}
          emptyLabel="Drop unscheduled, parts, reminders, or quick actions here."
          className={cn("grid gap-3", customize || layout.dock.length ? dockCols : "")}
        >
          {layout.dock.map((id) => widget(id, "dock"))}
        </WidgetDropZone>
      ) : null}

      {panel === "schedule" ? (
        <Modal title="Schedule Appointment" closeHref={mechanicScheduleHref({ view, date, moving: movingJobId, customize })}>
          <ScheduleForm date={date} resources={resources} unscheduled={unscheduled} customers={customers} selectedId={movingJobId} returnTo={mechanicScheduleHref({ view, date, customize })} />
        </Modal>
      ) : null}
      {panel === "block" ? (
        <Modal title="Block Time" closeHref={mechanicScheduleHref({ view, date, moving: movingJobId, customize })}>
          <BlockForm date={date} resources={resources} kind="BLOCK" label="Blocked" returnTo={returnTo} />
        </Modal>
      ) : null}
      {panel === "break" ? (
        <Modal title="Add Break" closeHref={mechanicScheduleHref({ view, date, moving: movingJobId, customize })}>
          <BlockForm date={date} resources={resources} kind="BREAK" label="Break" defaultTime="15:00" duration={30} returnTo={returnTo} />
        </Modal>
      ) : null}
      {panel === "swap" ? (
        <Modal title="Swap Jobs" closeHref={mechanicScheduleHref({ view, date, customize })}>
          <SwapForm jobs={jobs.filter((job) => job.scheduledAt)} selectedId={movingJobId} returnTo={mechanicScheduleHref({ view, date, customize })} />
        </Modal>
      ) : null}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint: string;
  tone: "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    blue: "bg-[#2f7bff]/15 text-[#7eb0ff]",
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-red-500/15 text-red-300",
  };
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
      <div className="flex items-center gap-2 text-white/55">
        <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", tones[tone])}>{icon}</span>
        <p className="text-xs font-semibold">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/40">{hint}</p>
    </article>
  );
}

function OnTimeCard({ pct }: { pct: number }) {
  const value = Math.max(0, Math.min(100, Math.round(pct)));
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
      <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="26" cy="26" r={r} fill="none" stroke="#22c55e" strokeWidth="6" strokeDasharray={`${(value / 100) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div>
        <p className="text-xs font-semibold text-white/55">On Time</p>
        <p className="text-2xl font-extrabold text-white">{value}%</p>
        <p className="text-[11px] text-white/40">Shop on-time rate</p>
      </div>
    </article>
  );
}

function StatsRow({ stats, compact }: { stats: BoardStats; compact: boolean }) {
  return (
    <section className={cn("grid gap-3", compact ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-6")}>
      <Stat icon={<CalendarDays className="h-4 w-4" />} label="Appointments" value={stats.appointments} hint={`${stats.appointmentsDelta >= 0 ? "+" : ""}${stats.appointmentsDelta}% vs last week`} tone="blue" />
      <Stat icon={<Wrench className="h-4 w-4" />} label="In Progress" value={stats.inProgress} hint="On the book now" tone="green" />
      <Stat icon={<Package className="h-4 w-4" />} label="Waiting on Parts" value={stats.waitingOnParts} hint="Parts on today's jobs" tone="amber" />
      <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Behind Schedule" value={stats.behind} hint="Past the booked window" tone="red" />
      <Stat icon={<DollarSign className="h-4 w-4" />} label="Est. Today Revenue" value={formatUsd(stats.revenueCents)} hint="Approved + sent estimates" tone="green" />
      <OnTimeCard pct={stats.onTimePct} />
    </section>
  );
}

function FiltersForm({
  view,
  date,
  movingJobId,
  customize,
  filters,
  resources,
  jobs,
  query,
  setQuery,
}: {
  view: ScheduleView;
  date: string;
  movingJobId?: string;
  customize: boolean;
  filters: { resource?: string; type?: string; status?: string; mode?: string; q?: string };
  resources: SchedulerResourceCard[];
  jobs: SchedulerJobCard[];
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <form className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#0d1c2e] p-2" action="/mechanic/schedule">
      {view !== "day" ? <input type="hidden" name="view" value={view} /> : null}
      <input type="hidden" name="date" value={date} />
      {movingJobId ? <input type="hidden" name="moving" value={movingJobId} /> : null}
      {customize ? <input type="hidden" name="customize" value="1" /> : null}
      <FilterSelect name="resource" defaultValue={filters.resource ?? ""}>
        <option value="">All Technicians</option>
        {resources.map((resource) => (
          <option key={resource.id} value={resource.id}>
            {resource.name}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect name="type" defaultValue={filters.type ?? ""}>
        <option value="">All Job Types</option>
        {Array.from(new Set(jobs.map((job) => job.category))).map((category) => (
          <option key={category} value={category}>
            {category.replaceAll("_", " ")}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect name="status" defaultValue={filters.status ?? ""}>
        <option value="">All Statuses</option>
        {Array.from(new Set(jobs.map((job) => job.status))).map((status) => (
          <option key={status} value={status}>
            {status.replaceAll("_", " ")}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect name="mode" defaultValue={filters.mode ?? ""}>
        <option value="">Shop + Mobile</option>
        <option value="shop">Shop</option>
        <option value="mobile">Mobile</option>
      </FilterSelect>
      <label className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search schedule..."
          className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35"
        />
      </label>
      <button type="submit" className="h-9 rounded-lg bg-white/10 px-3 text-sm font-semibold text-white">
        Filter
      </button>
    </form>
  );
}

function AgendaPanel({ date, agenda }: { date: string; agenda: SchedulerJobCard[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Today&apos;s Agenda</h2>
        <Link href={mechanicScheduleHref({ view: "day", date })} className="text-[11px] font-semibold text-[#7eb0ff]">
          View All
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {agenda.length === 0 ? <p className="text-sm text-white/45">Nothing on the book for this day.</p> : null}
        {agenda.slice(0, 6).map((job) => {
          const chip = statusChip(job.status, job.waitingOnParts);
          return (
            <Link key={job.id} href={job.href} className="flex items-start gap-3 rounded-xl px-1 py-1.5 hover:bg-white/5">
              <p className="w-14 shrink-0 text-[11px] font-bold text-white/50">{job.timeLabel}</p>
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: job.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{job.title}</p>
                <p className="truncate text-[11px] text-white/45">{job.vehicleLabel}</p>
              </div>
              <span className={chipClass(chip.tone)}>{chip.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function MapPanel({
  origin,
  roadStops,
  shopName,
  shopCity,
  shopState,
}: {
  origin: { latitude: number; longitude: number; label: string };
  roadStops: SchedulerJobCard[];
  shopName: string;
  shopCity: string;
  shopState: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">On the Road</h2>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Live</span>
      </div>
      <RoadMap origin={origin} stops={roadStops} shopName={shopName} />
      <a
        href={mapsRouteUrl(
          origin,
          roadStops
            .filter((stop) => stop.latitude != null && stop.longitude != null)
            .map((stop) => ({ latitude: stop.latitude!, longitude: stop.longitude! })),
        )}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex text-sm font-semibold text-[#7eb0ff]"
      >
        View Route
      </a>
      <p className="mt-1 text-[11px] text-white/40">
        {origin.label}
        {shopCity ? ` · ${shopCity}, ${shopState}` : ""}
      </p>
    </section>
  );
}

function FilterSelect({ name, defaultValue, children }: { name: string; defaultValue: string; children: React.ReactNode }) {
  return (
    <select name={name} defaultValue={defaultValue} className="h-9 rounded-lg border border-white/10 bg-[#071422] px-2 text-sm text-white">
      {children}
    </select>
  );
}

function MiniCalendar({
  monthLabel,
  days,
  selected,
  movingJobId,
}: {
  monthLabel: string;
  days: CalendarDay[];
  selected: string;
  movingJobId?: string;
}) {
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">{monthLabel}</h2>
        <Link href={mechanicScheduleHref({ view: "month", date: selected, moving: movingJobId })} className="text-[11px] font-semibold text-[#7eb0ff]">
          Month
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-white/35">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => (
          <Link
            key={day.date}
            href={mechanicScheduleHref({ view: "day", date: day.date, moving: movingJobId })}
            className={cn(
              "flex h-8 items-center justify-center rounded-md text-xs font-semibold",
              day.date === selected ? "bg-[#2f7bff] text-white" : day.inMonth ? "text-white/80 hover:bg-white/5" : "text-white/25",
            )}
          >
            <span className="relative">
              {Number(day.date.slice(8))}
              {day.count ? <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#7eb0ff]" /> : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RoadMap({
  origin,
  stops,
  shopName,
}: {
  origin: { latitude: number; longitude: number };
  stops: SchedulerJobCard[];
  shopName: string;
}) {
  const points = [
    { x: 28, y: 118, label: shopName },
    ...stops.slice(0, 4).map((stop, index) => ({
      x: 60 + index * 42,
      y: 90 - (index % 2) * 28,
      label: stop.vehicleLabel,
    })),
  ];
  const d = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  return (
    <svg viewBox="0 0 260 150" className="mt-3 h-[150px] w-full rounded-xl bg-[#071422]">
      <path d="M10 40 C80 10, 120 70, 250 30" fill="none" stroke="rgba(47,123,255,0.25)" strokeWidth="8" />
      <path d="M0 90 C70 110, 140 50, 260 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <path d={d} fill="none" stroke="#2f7bff" strokeWidth="3" strokeDasharray="6 6" />
      {points.map((point, index) => (
        <g key={`${point.x}-${point.y}`}>
          <circle cx={point.x} cy={point.y} r={index === 0 ? 7 : 6} fill={index === 0 ? "#22c55e" : "#2f7bff"} />
          <text x={point.x + 8} y={point.y - 8} fill="rgba(255,255,255,0.7)" fontSize="8">
            {index === 0 ? "Shop" : `${index}`}
          </text>
        </g>
      ))}
    </svg>
  );
}

function UnscheduledPanel({
  date,
  view,
  unscheduled,
}: {
  date: string;
  view: ScheduleView;
  unscheduled: SchedulerJobCard[];
}) {
  return (
    <Dock title={`Unscheduled Requests (${unscheduled.length})`} href={mechanicScheduleHref({ view, date, panel: "schedule" })}>
      {unscheduled.slice(0, 3).map((job) => {
        const chip = unscheduledPriority(job.status);
        return (
          <div key={job.id} className="rounded-xl bg-[#071422] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className={chipClass(chip.tone)}>{chip.label}</span>
              <p className="text-[10px] text-white/40">{job.createdLabel}</p>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-white">{job.title}</p>
            <p className="truncate text-[11px] text-white/45">{job.vehicleLabel}</p>
            <Link
              href={mechanicScheduleHref({ view, date, moving: job.id, panel: "schedule" })}
              className="mt-2 inline-block text-[11px] font-semibold text-[#7eb0ff]"
            >
              Schedule
            </Link>
          </div>
        );
      })}
      {unscheduled.length === 0 ? <p className="text-sm text-white/45">The request queue is clear.</p> : null}
    </Dock>
  );
}

function PartsPanel({ parts }: { parts: SchedulerPartArrival[] }) {
  return (
    <Dock title="Parts Arriving Today" href="/mechanic/estimates">
      {parts.length === 0 ? <p className="text-sm text-white/45">No parts holds on today&apos;s jobs.</p> : null}
      {parts.map((item) => (
        <Link key={item.id} href={item.href} className="flex items-start justify-between gap-2 rounded-xl bg-[#071422] p-3">
          <div>
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-[11px] text-white/45">{item.detail}</p>
          </div>
          <span className={chipClass(item.onTrack ? "green" : "amber")}>{item.onTrack ? "On Track" : "Watch"}</span>
        </Link>
      ))}
    </Dock>
  );
}

function RemindersPanel({ reminders }: { reminders: SchedulerReminder[] }) {
  return (
    <Dock title={`Reminders (${reminders.length})`} href="/mechanic/notifications">
      {reminders.length === 0 ? <p className="text-sm text-white/45">Nothing waiting on you.</p> : null}
      {reminders.map((item) => (
        <Link key={item.id} href={item.href} className="block rounded-xl bg-[#071422] p-3">
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="text-[11px] text-white/45">{item.detail}</p>
        </Link>
      ))}
    </Dock>
  );
}

function QuickActionsPanel({
  date,
  view,
  resources,
  jobs,
  movingJobId,
  returnTo,
}: {
  date: string;
  view: ScheduleView;
  resources: SchedulerResourceCard[];
  jobs: SchedulerJobCard[];
  movingJobId?: string;
  returnTo: string;
}) {
  const firstTech = resources.find((item) => item.kind === "TECH") ?? resources[0];
  const sendHref = jobs[0]?.messageHref ?? "/mechanic/messages";
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
      <h2 className="text-sm font-bold text-white">Quick Actions</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={mechanicScheduleHref({ view, date, moving: movingJobId, panel: "block" })} className={quickClass}>
          <Clock3 className="h-4 w-4" />
          Block Time
        </Link>
        <Link href={mechanicScheduleHref({ view, date, moving: movingJobId, panel: "break" })} className={quickClass}>
          <Coffee className="h-4 w-4" />
          Add Break
        </Link>
        <Link href={mechanicScheduleHref({ view, date, moving: movingJobId, panel: "swap" })} className={quickClass}>
          <ArrowLeftRight className="h-4 w-4" />
          Swap Jobs
        </Link>
        <Link href={sendHref} className={quickClass}>
          <Send className="h-4 w-4" />
          Send Update
        </Link>
      </div>
      {firstTech ? (
        <form action={createSchedulerBlockAction} className="sr-only">
          <input type="hidden" name="resourceId" value={firstTech.id} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value="12:00" />
          <input type="hidden" name="durationMinutes" value="30" />
          <input type="hidden" name="kind" value="BREAK" />
          <input type="hidden" name="returnTo" value={returnTo} />
        </form>
      ) : null}
    </section>
  );
}

const quickClass =
  "inline-flex h-16 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#071422] text-[11px] font-semibold text-white/80 hover:bg-white/5";

function Dock({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <Link href={href} className="text-[11px] font-semibold text-[#7eb0ff]">
          View All
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function chipClass(tone: "red" | "amber" | "blue" | "green" | "ok" | "warn" | "info" | "violet") {
  if (tone === "red" || tone === "warn") return "rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300";
  if (tone === "amber") return "rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300";
  if (tone === "violet") return "rounded-full bg-[#7b4fd4]/20 px-2 py-0.5 text-[10px] font-bold text-[#c4b5fd]";
  if (tone === "green" || tone === "ok") return "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300";
  return "rounded-full bg-[#2f7bff]/15 px-2 py-0.5 text-[10px] font-bold text-[#9cc4ff]";
}

function Modal({ title, closeHref, children }: { title: string; closeHref: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1c2e] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <Link href={closeHref} className="text-sm font-semibold text-white/60 hover:text-white">
            Close
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

function ScheduleForm({
  date,
  resources,
  unscheduled,
  customers,
  selectedId,
  returnTo,
}: {
  date: string;
  resources: SchedulerResourceCard[];
  unscheduled: SchedulerJobCard[];
  customers: CustomerOption[];
  selectedId?: string;
  returnTo: string;
}) {
  const options = unscheduled.length ? unscheduled : [];
  return (
    <div className="space-y-5">
      {options.length ? (
        <form action={scheduleAppointmentAction} className="space-y-3">
          <input type="hidden" name="returnTo" value={returnTo} />
          <Field label="Unscheduled request">
            <select name="jobId" defaultValue={selectedId ?? options[0]?.id} className={fieldClass} required>
              {options.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.customerFullName} · {job.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input name="date" type="date" required defaultValue={date} className={fieldClass} />
            </Field>
            <Field label="Time">
              <TimeSelect name="time" defaultValue="09:00" />
            </Field>
          </div>
          <Field label="Technician / bay">
            <select name="resourceId" defaultValue={resources[0]?.id} className={fieldClass}>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration (minutes)">
            <input name="durationMinutes" type="number" min={15} max={480} step={15} defaultValue={90} className={fieldClass} />
          </Field>
          <button type="submit" className="inline-flex h-10 items-center rounded-lg bg-[#2f7bff] px-4 text-sm font-semibold text-white">
            Park on the board
          </button>
        </form>
      ) : (
        <p className="text-sm text-white/55">No unscheduled requests. Create a new repair order below.</p>
      )}
      <form action={createShopRepairOrderAction} className="space-y-3 border-t border-white/10 pt-4">
        <input type="hidden" name="returnTo" value={returnTo} />
        <p className="text-sm font-semibold text-white">New repair order</p>
        <Field label="Customer vehicle">
          <select name="vehicleId" required defaultValue="" className={fieldClass}>
            <option value="" disabled>
              Choose a machine
            </option>
            {customers.map((customer) => (
              <optgroup key={customer.id} label={customer.name}>
                {customer.vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {customer.name} · {vehicle.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="What needs done?">
          <input name="problemText" required minLength={8} placeholder="e.g. Brake inspection" className={fieldClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input name="date" type="date" defaultValue={date} className={fieldClass} />
          </Field>
          <Field label="Time">
            <TimeSelect name="time" defaultValue="09:00" />
          </Field>
        </div>
        <Field label="Lane">
          <select name="resourceId" defaultValue={resources[0]?.id} className={fieldClass}>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className="inline-flex h-10 items-center rounded-lg border border-white/15 px-4 text-sm font-semibold text-white">
          Create and schedule
        </button>
      </form>
    </div>
  );
}

function BlockForm({
  date,
  resources,
  kind,
  label,
  defaultTime = "12:00",
  duration = 60,
  returnTo,
}: {
  date: string;
  resources: SchedulerResourceCard[];
  kind: string;
  label: string;
  defaultTime?: string;
  duration?: number;
  returnTo: string;
}) {
  return (
    <form action={createSchedulerBlockAction} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Field label="Lane">
        <select name="resourceId" defaultValue={resources[0]?.id} className={fieldClass} required>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input name="date" type="date" required defaultValue={date} className={fieldClass} />
        </Field>
        <Field label="Start">
          <TimeSelect name="time" defaultValue={defaultTime} />
        </Field>
      </div>
      <Field label="Minutes">
        <input name="durationMinutes" type="number" min={15} max={240} step={15} defaultValue={duration} className={fieldClass} />
      </Field>
      <Field label="Label">
        <input name="label" defaultValue={label} className={fieldClass} />
      </Field>
      <button type="submit" className="inline-flex h-10 items-center rounded-lg bg-[#2f7bff] px-4 text-sm font-semibold text-white">
        Save on the board
      </button>
    </form>
  );
}

function SwapForm({
  jobs,
  selectedId,
  returnTo,
}: {
  jobs: SchedulerJobCard[];
  selectedId?: string;
  returnTo: string;
}) {
  if (jobs.length < 2) return <p className="text-sm text-white/55">Need two booked jobs to swap.</p>;
  const other = jobs.find((job) => job.id !== selectedId)?.id ?? jobs[1]?.id;
  return (
    <form action={swapScheduleJobsAction} className="space-y-3">
      <input type="hidden" name="returnTo" value={returnTo} />
      <Field label="First job">
        <select name="jobA" defaultValue={selectedId ?? jobs[0].id} className={fieldClass}>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.timeLabel} · {job.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Second job">
        <select name="jobB" defaultValue={other} className={fieldClass}>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.timeLabel} · {job.title}
            </option>
          ))}
        </select>
      </Field>
      <button type="submit" className="inline-flex h-10 items-center rounded-lg bg-[#2f7bff] px-4 text-sm font-semibold text-white">
        Swap times
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-white/55">{label}</span>
      {children}
    </label>
  );
}

function TimeSelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  const options: string[] = [];
  for (let minutes = 7 * 60; minutes <= 17 * 60 + 45; minutes += 15) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    options.push(`${hour}:${minute}`);
  }
  const value = options.includes(defaultValue) ? defaultValue : "09:00";
  return (
    <select name={name} defaultValue={value} className={fieldClass}>
      {options.map((time) => {
        const [hour, minute] = time.split(":").map(Number);
        const suffix = hour >= 12 ? "PM" : "AM";
        const display = hour % 12 === 0 ? 12 : hour % 12;
        return (
          <option key={time} value={time}>
            {display}:{String(minute).padStart(2, "0")} {suffix}
          </option>
        );
      })}
    </select>
  );
}

const fieldClass =
  "h-10 w-full rounded-lg border border-white/10 bg-[#071422] px-3 text-sm text-white outline-none";

