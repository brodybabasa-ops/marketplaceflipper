"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createScheduleBlockAction, moveScheduleBlockAction, sendScheduleUpdateAction } from "@/app/actions/vision";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { scheduleMessageTemplate } from "@/lib/schedule-intelligence";
import {
  TONE_CLASS,
  displayTitle,
  intersectsNow,
  isBlockedKind,
  moneyLabel,
  type ColorMode,
  type Density,
  minutesFromOpen,
  pxPerHour,
  visualTone,
} from "@/lib/schedule-visual";

export type CommandCard = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  technicianProfileId: string | null;
  resourceId: string | null;
  jobId: string | null;
  kind: string;
  assetLabel: string | null;
  customerName: string | null;
  waiting: boolean;
  partsStatus: string;
  authorization: string;
  authorizedCents: number;
  behind: boolean;
  inProgress: boolean;
  minutesBehind: number;
  durationMin: number;
  jobStatus: string | null;
  category: string | null;
  requestKind: string | null;
  urgencyMode: string;
  complaint: string | null;
  technicianName: string | null;
  resourceName: string | null;
  progressPct: number;
  progressLabel: string;
  checkIn: string;
  source: string;
  potentiallyDelayed: boolean;
  slip: { delayMinutes: number; message: string } | null;
  promiseAtRisk: boolean;
};

export type CommandTech = {
  id: string;
  name: string;
  title: string | null;
  duty: string;
  hoursStart: string;
  hoursEnd: string;
  pct: number;
  scheduledHours: number;
  availableHours: number;
  currentTitle: string | null;
  off: boolean;
};

export type CommandResource = { id: string; name: string; kind: string };

export type UnscheduledItem = {
  jobId: string;
  title: string;
  asset: string;
  customer: string;
  source: string;
  hours: number;
  parts: string;
  recommendedTech: string;
  fitHref: string;
};

function clock(value: Date) {
  return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function hourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:00 ${suffix}`;
}

function snapMinutes(min: number, step: number) {
  return Math.round(min / step) * step;
}

export function CommandBoard({
  date,
  shopStart,
  shopEnd,
  showBays,
  showTravel,
  header,
  attention,
  techs,
  resources,
  cards,
  unscheduled,
  arrivals,
  upcoming,
  monthDays,
  fillOpenHours,
  jobs,
  view = "day",
}: {
  date: string;
  shopStart: number;
  shopEnd: number;
  showBays: boolean;
  showTravel: boolean;
  header: {
    appointments: number;
    inProgress: number;
    waitingOnParts: number;
    awaitingApproval: number;
    behind: number;
    ready: number;
    expectedCents: number;
    openHours: number;
    utilization: number;
    waitingCustomers: number;
    arrivingSoon: number;
    averageHours: number;
    technicianCount: number;
    onSite: number;
  };
  attention: { href: string; label: string; tone: string; filter?: string; blockId?: string | null }[];
  techs: CommandTech[];
  resources: CommandResource[];
  cards: CommandCard[];
  unscheduled: UnscheduledItem[];
  arrivals: { id: string; time: string; customerName: string | null; assetLabel: string | null; checkIn: string; jobId: string | null }[];
  upcoming: { id: string; title: string; when: string; assetLabel: string; cents: number; kind: string }[];
  monthDays: { date: string; pct: number }[];
  fillOpenHours: number;
  jobs: { id: string; label: string }[];
  view?: string;
}) {
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const nowLine = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [density, setDensity] = useState<Density>("standard");
  const [colorMode, setColorMode] = useState<ColorMode>("type");
  const [laneMode, setLaneMode] = useState<"techs" | "bays" | "combined">(showBays ? "combined" : "techs");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [composer, setComposer] = useState<{ hour: number; minute: number; laneId: string; kind?: string } | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: { id: string; startsAt: string; endsAt: string; technicianProfileId: string | null; resourceId: string | null } } | null>(null);
  const [conflict, setConflict] = useState<{ message: string; retry: FormData } | null>(null);
  const [notes, setNotes] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [messageKind, setMessageKind] = useState<"CHECKED_IN" | "BEHIND" | "INSPECTION" | "READY">("READY");
  const [messageBody, setMessageBody] = useState(scheduleMessageTemplate("READY"));
  const scrolledNow = useRef(false);
  const hourPx = pxPerHour(density);
  const timelineStart = Math.max(6, shopStart - 1);
  const timelineEnd = Math.max(shopEnd, shopStart + 10);
  const totalHours = timelineEnd - timelineStart;
  const height = totalHours * hourPx;
  const selected = cards.find((card) => card.id === selectedId) ?? null;
  const todayKey = new Date().toISOString().slice(0, 10);
  const isToday = date === todayKey;

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 15000);
    const refresh = window.setInterval(() => router.refresh(), 90000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(refresh);
    };
  }, [router]);

  useEffect(() => {
    const stored = window.localStorage.getItem("pm-schedule-color");
    if (stored === "type" || stored === "status") setColorMode(stored);
    const densityStored = window.localStorage.getItem("pm-schedule-density");
    if (densityStored === "compact" || densityStored === "standard" || densityStored === "detailed") setDensity(densityStored);
    setNotes(window.localStorage.getItem(`pm-day-notes-${date}`) ?? "");
  }, [date]);

  useEffect(() => {
    scrolledNow.current = false;
  }, [date]);

  useEffect(() => {
    function close() {
      setMenu(null);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const kind = selected.behind ? "BEHIND" : selected.checkIn === "CHECKED_IN" ? "CHECKED_IN" : selected.jobStatus === "READY" ? "READY" : selected.category === "DIAGNOSTICS" ? "INSPECTION" : "READY";
    setMessageKind(kind);
    setMessageBody(scheduleMessageTemplate(kind));
  }, [selectedId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        router.push("/mechanic/schedule");
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setComposer({ hour: shopStart, minute: 0, laneId: techs[0]?.id ?? "solo" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, shopStart, techs]);

  const lanes = useMemo(() => {
    const techLanes = techs.map((tech) => ({
      id: tech.id,
      name: tech.name.split(" ")[0] ?? tech.name,
      fullName: tech.name,
      subtitle: tech.off ? "Time off" : tech.title || tech.duty.replaceAll("_", " ").toLowerCase(),
      kind: "tech" as const,
      pct: tech.pct,
      current: tech.currentTitle,
      off: tech.off,
      hours: `${tech.hoursStart}–${tech.hoursEnd}`,
    }));
    const bayLanes = resources.map((item) => ({
      id: item.id,
      name: item.name,
      fullName: item.name,
      subtitle: item.kind.replaceAll("_", " ").toLowerCase(),
      kind: "resource" as const,
      pct: null as number | null,
      current: (() => {
        const liveTitle = cards.find((card) => card.resourceId === item.id && new Date(card.startsAt) <= now && new Date(card.endsAt) > now)?.title;
        return liveTitle ? displayTitle(liveTitle) : null;
      })(),
      off: false,
      hours: "",
    }));
    if (laneMode === "bays" && bayLanes.length) return bayLanes;
    if (laneMode === "combined" && bayLanes.length) return [...techLanes, ...bayLanes];
    return techLanes;
  }, [laneMode, resources, techs, cards, now]);

  const visibleCards = cards.filter((card) => {
    if (filter === "late") return card.behind;
    if (filter === "waiting") return card.waiting || card.jobStatus === "AWAITING_APPROVAL" || card.partsStatus === "DELAYED";
    if (filter === "parts") return ["ORDERED", "ARRIVING", "DELAYED"].includes(card.partsStatus);
    if (filter === "marketplace") return card.source === "MARKETPLACE";
    if (filter === "fleet") return card.source === "FLEET";
    if (filter === "mobile") return card.kind === "TRAVEL" || card.requestKind === "ROADSIDE";
    return true;
  });

  const nowTop = minutesFromOpen(now, timelineStart) * (hourPx / 60);
  const showNow = isToday && nowTop >= 0 && nowTop <= height;

  useEffect(() => {
    if (!isToday || scrolledNow.current) return;
    const id = window.setTimeout(() => {
      nowLine.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      scrolledNow.current = true;
    }, 120);
    return () => window.clearTimeout(id);
  }, [isToday, showNow]);

  function timeFromY(y: number) {
    const minutes = snapMinutes(Math.max(0, (y / hourPx) * 60), density === "compact" ? 30 : 15);
    const total = timelineStart * 60 + minutes;
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    return { hour, minute, startsAt: new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`) };
  }

  async function place(input: {
    type: "block" | "job";
    id: string;
    title?: string;
    durationMin: number;
    laneId: string;
    startsAt: Date;
    previous?: CommandCard;
    override?: string;
  }) {
    const endsAt = new Date(input.startsAt.getTime() + input.durationMin * 60000);
    const form = new FormData();
    form.set("startsAt", input.startsAt.toISOString());
    form.set("endsAt", endsAt.toISOString());
    if (input.override) form.set("overrideReason", input.override);
    if (lanes.find((lane) => lane.id === input.laneId)?.kind === "resource") form.set("resourceId", input.laneId);
    else if (input.laneId !== "solo") form.set("technicianProfileId", input.laneId);
    if (input.type === "block") {
      form.set("blockId", input.id);
      const result = await moveScheduleBlockAction(form);
      if (!result.ok) {
        setConflict({ message: result.error, retry: form });
        return;
      }
      setToast({
        text: `${input.title ?? "Work"} moved to ${clock(input.startsAt)}.`,
        undo: input.previous
          ? {
              id: input.id,
              startsAt: input.previous.startsAt,
              endsAt: input.previous.endsAt,
              technicianProfileId: input.previous.technicianProfileId,
              resourceId: input.previous.resourceId,
            }
          : undefined,
      });
      router.refresh();
      return;
    }
    form.set("jobId", input.id);
    form.set("title", input.title || "Work");
    form.set("kind", "WORK");
    const result = await createScheduleBlockAction(form);
    if (!result.ok) {
      setConflict({ message: result.error, retry: form });
      return;
    }
    setToast({ text: `${input.title ?? "Job"} placed at ${clock(input.startsAt)}. Confirm the customer if this is a commitment.` });
    router.refresh();
  }

  async function undoMove() {
    if (!toast?.undo) return;
    const form = new FormData();
    form.set("blockId", toast.undo.id);
    form.set("startsAt", toast.undo.startsAt);
    form.set("endsAt", toast.undo.endsAt);
    if (toast.undo.technicianProfileId) form.set("technicianProfileId", toast.undo.technicianProfileId);
    if (toast.undo.resourceId) form.set("resourceId", toast.undo.resourceId);
    form.set("overrideReason", "Undo last move");
    await moveScheduleBlockAction(form);
    setToast(null);
    router.refresh();
  }

  async function overrideConflict() {
    if (!conflict) return;
    conflict.retry.set("overrideReason", "Advisor override");
    if (conflict.retry.get("blockId")) await moveScheduleBlockAction(conflict.retry);
    else await createScheduleBlockAction(conflict.retry);
    setConflict(null);
    setToast({ text: "Scheduled with override. The original conflict is still recorded." });
    router.refresh();
  }

  function scrollNow() {
    nowLine.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">Schedule</h1>
          <p className="mt-1 text-sm text-muted">
            {showTravel && !showBays
              ? "Manage appointments, jobs, and field workload."
              : "Manage appointments, jobs, and technician workload."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveClock now={now} />
          <Button type="button" onClick={() => setComposer({ hour: shopStart, minute: 0, laneId: techs[0]?.id ?? "solo" })}>
            + New Appointment
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Today’s Appointments" value={header.appointments} />
        <Metric label="Jobs In Progress" value={header.inProgress} tone="success" />
        <Metric label="Average Job Time" value={`${header.averageHours || 0} hrs`} />
        <Metric label="Shop Utilization" value={`${header.utilization}%`}>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-soft">
            <div className={cn("h-full rounded-full", header.utilization > 100 ? "bg-danger" : header.utilization > 85 ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(100, header.utilization)}%` }} />
          </div>
        </Metric>
        <Metric label="Technicians" value={header.technicianCount || techs.length} hint={`${header.onSite} on site`} />
      </div>

      {attention.length ? (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-[11px] font-semibold uppercase tracking-[0.14em] text-warning">Needs attention</span>
          {attention.slice(0, 5).map((item) => (
            <button
              key={item.href + item.label}
              type="button"
              onClick={() => {
                if (item.filter) setFilter(item.filter);
                if (item.blockId) setSelectedId(item.blockId);
              }}
              className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-ink"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={date === todayKey ? "primary" : "secondary"}>
          <Link href="/mechanic/schedule">Today</Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/mechanic/schedule?date=${shiftDate(date, -1)}`} aria-label="Previous day">
            ‹
          </Link>
        </Button>
        <span className="min-w-40 text-center text-sm font-semibold text-ink">
          {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </span>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/mechanic/schedule?date=${shiftDate(date, 1)}`} aria-label="Next day">
            ›
          </Link>
        </Button>
        <Button size="sm" variant="secondary" type="button" onClick={scrollNow}>
          Now
        </Button>
        <div className="flex rounded-xl border border-line bg-navy/40 p-0.5">
          {(["day", "week", "month", "list"] as const).map((item) => (
            <Link
              key={item}
              href={`/mechanic/schedule?date=${date}&view=${item}`}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold capitalize", view === item ? "bg-accent text-white" : "text-muted hover:text-ink")}
            >
              {item}
            </Link>
          ))}
          {showTravel && !showBays ? (
            <Link href={`/mechanic/schedule?date=${date}&view=routes`} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", view === "routes" ? "bg-accent text-white" : "text-muted hover:text-ink")}>
              Routes
            </Link>
          ) : null}
        </div>
        <span className="ml-auto" />
        <Button size="sm" variant="secondary" type="button" onClick={() => setFiltersOpen((open) => !open)}>
          Filters
        </Button>
        {showBays ? (
          <div className="flex rounded-xl border border-line">
            <button type="button" className={cn("px-3 py-1.5 text-xs font-semibold", laneMode === "combined" ? "bg-accent text-white" : "text-muted")} onClick={() => setLaneMode("combined")}>
              All
            </button>
            <button type="button" className={cn("px-3 py-1.5 text-xs font-semibold", laneMode === "techs" ? "bg-accent text-white" : "text-muted")} onClick={() => setLaneMode("techs")}>
              Technicians
            </button>
            <button type="button" className={cn("px-3 py-1.5 text-xs font-semibold", laneMode === "bays" ? "bg-accent text-white" : "text-muted")} onClick={() => setLaneMode("bays")}>
              Bays
            </button>
          </div>
        ) : null}
      </div>

      {filtersOpen ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2">
          {filter !== "all" ? (
            <Button size="sm" variant="secondary" type="button" onClick={() => setFilter("all")}>
              Clear filters
            </Button>
          ) : null}
          <Select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-9 w-40">
            <option value="all">All work</option>
            <option value="late">Running late</option>
            <option value="waiting">Waiting</option>
            <option value="parts">Parts</option>
            <option value="marketplace">Marketplace</option>
            {showTravel ? <option value="mobile">Mobile / field</option> : null}
            <option value="fleet">Fleet</option>
          </Select>
          <Select
            value={colorMode}
            onChange={(event) => {
              const value = event.target.value as ColorMode;
              setColorMode(value);
              window.localStorage.setItem("pm-schedule-color", value);
            }}
            className="h-9 w-44"
          >
            <option value="type">Color by service</option>
            <option value="status">Color by status</option>
          </Select>
          <Select
            value={density}
            onChange={(event) => {
              const value = event.target.value as Density;
              setDensity(value);
              window.localStorage.setItem("pm-schedule-density", value);
            }}
            className="h-9 w-32"
          >
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
          </Select>
        </div>
      ) : null}

      <ul className="space-y-2 lg:hidden">
        {visibleCards
          .slice()
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
          .map((card) => (
            <li key={card.id}>
              <button type="button" onClick={() => setSelectedId(card.id)} className="w-full rounded-xl border border-line bg-card p-3 text-left">
                <p className="text-xs text-muted">
                  {clock(new Date(card.startsAt))}–{clock(new Date(card.endsAt))} · {card.technicianName ?? "Unassigned"}
                </p>
                <p className="font-semibold">{displayTitle(card.title)}</p>
                <p className="text-xs text-muted">
                  {card.assetLabel} {card.behind ? `· running late +${card.minutesBehind} min` : `· ${card.progressLabel}`}
                </p>
              </button>
            </li>
          ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="hidden overflow-hidden p-0 lg:block">
          <div ref={scroller} className="relative max-h-[78vh] overflow-auto">
            <div className="sticky top-0 z-30 grid border-b border-line bg-navy/95 backdrop-blur" style={{ gridTemplateColumns: `4.25rem repeat(${Math.max(lanes.length, 1)}, minmax(8.5rem, 1fr))` }}>
              <div className="px-2 py-3 text-[10px] uppercase tracking-wide text-muted">Time</div>
              {lanes.map((lane) => (
                <div key={lane.id} className="border-l border-line px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate text-[11px] font-bold">
                      {lane.kind === "resource" ? "B" : lane.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{lane.name}</p>
                      <p className="truncate text-[10px] capitalize text-muted">{lane.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative" style={{ height }}>
              {Array.from({ length: totalHours + 1 }, (_, index) => timelineStart + index).map((hour) => {
                const closed = hour < shopStart || hour >= shopEnd;
                return (
                  <div key={hour} className={cn("absolute right-0 left-0 border-t border-line/80", closed && "bg-navy/50")} style={{ top: (hour - timelineStart) * hourPx, height: hourPx }}>
                    <span className="number absolute left-1 top-1 text-[10px] text-muted">{hourLabel(hour)}</span>
                  </div>
                );
              })}
              {showNow ? (
                <div ref={nowLine} className="pm-now-line absolute right-0 left-0" style={{ top: nowTop }}>
                  <span className="absolute -top-3 left-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">{clock(now)}</span>
                </div>
              ) : null}
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `4.25rem repeat(${Math.max(lanes.length, 1)}, minmax(8.5rem, 1fr))` }}>
                <div />
                {lanes.map((lane) => (
                  <div
                    key={lane.id}
                    className="relative border-l border-line/70"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const raw = event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");
                      if (!raw) return;
                      const payload = JSON.parse(raw) as { type: "block" | "job"; id: string; title?: string; durationMin: number };
                      const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const { startsAt } = timeFromY(event.clientY - rect.top);
                      const previous = cards.find((card) => card.id === payload.id);
                      void place({ ...payload, laneId: lane.id, startsAt, previous });
                    }}
                    onDoubleClick={(event) => {
                      const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const t = timeFromY(event.clientY - rect.top);
                      setComposer({ hour: t.hour, minute: t.minute, laneId: lane.id });
                    }}
                  >
                    {visibleCards
                      .filter((card) => {
                        if (lane.kind === "resource") return card.resourceId === lane.id;
                        if (lane.id === "solo") return true;
                        if (card.technicianProfileId) return card.technicianProfileId === lane.id;
                        return lane.id === lanes[0]?.id;
                      })
                      .map((card) => (
                        <JobBlock
                          key={card.id}
                          card={card}
                          now={now}
                          timelineStart={timelineStart}
                          hourPx={hourPx}
                          colorMode={colorMode}
                          offsite={showTravel}
                          selected={selectedId === card.id}
                          onSelect={() => setSelectedId(card.id)}
                          onMenu={(event) => {
                            event.preventDefault();
                            setSelectedId(card.id);
                            setMenu({ x: event.clientX, y: event.clientY, id: card.id });
                          }}
                          onResize={async (endsAt) => {
                            const form = new FormData();
                            form.set("blockId", card.id);
                            form.set("startsAt", card.startsAt);
                            form.set("endsAt", endsAt.toISOString());
                            if (card.technicianProfileId) form.set("technicianProfileId", card.technicianProfileId);
                            const result = await moveScheduleBlockAction(form);
                            if (!result.ok) setConflict({ message: result.error, retry: form });
                            else {
                              setToast({ text: `${displayTitle(card.title)} duration updated.`, undo: { id: card.id, startsAt: card.startsAt, endsAt: card.endsAt, technicianProfileId: card.technicianProfileId, resourceId: card.resourceId } });
                              router.refresh();
                            }
                          }}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <aside className="space-y-3">
          {selected ? (
            <Card className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Appointment</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{displayTitle(selected.title)}</h2>
              <p className="text-sm text-muted">
                {selected.assetLabel} {selected.customerName ? `· ${selected.customerName}` : ""}
              </p>
              <p className="mt-2 text-xs text-muted">
                {clock(new Date(selected.startsAt))}–{clock(new Date(selected.endsAt))} · {selected.technicianName ?? "Unassigned"}
                {selected.resourceName ? ` · ${selected.resourceName}` : ""}
              </p>
              <p className="mt-2 text-sm">
                {selected.progressLabel}
                {selected.behind ? ` · running late +${selected.minutesBehind} min` : ""}
                {selected.authorizedCents >= 250000 ? ` · ${moneyLabel(selected.authorizedCents)}` : ""}
              </p>
              {selected.complaint ? <p className="mt-2 text-sm text-muted">{displayTitle(selected.complaint)}</p> : null}
              {selected.slip ? <p className="mt-2 text-xs text-danger">Schedule at risk · {selected.slip.message}</p> : null}
              {selected.potentiallyDelayed ? (
                <div className="mt-2 rounded-xl border border-warning/30 bg-warning/10 p-2 text-xs text-warning">
                  Potentially delayed. Customer has not been notified.
                  {selected.jobId ? (
                    <Link className="ml-2 font-semibold text-ink" href={`/mechanic/jobs/${selected.jobId}`}>
                      Message customer
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-2 text-[11px] uppercase tracking-wide text-muted">
                {selected.source.toLowerCase()} · parts {selected.partsStatus.toLowerCase()} · {selected.checkIn.replaceAll("_", " ").toLowerCase()}
              </p>
              {selected.jobId ? (
                <form action={sendScheduleUpdateAction} className="mt-3 space-y-2">
                  <input type="hidden" name="jobId" value={selected.jobId} />
                  <Select
                    value={messageKind}
                    onChange={(event) => {
                      const kind = event.target.value as typeof messageKind;
                      setMessageKind(kind);
                      setMessageBody(scheduleMessageTemplate(kind));
                    }}
                  >
                    <option value="CHECKED_IN">Checked in</option>
                    <option value="BEHIND">Running behind</option>
                    <option value="INSPECTION">Inspection complete</option>
                    <option value="READY">Vehicle ready</option>
                  </Select>
                  <textarea name="body" className="min-h-20 w-full rounded-xl border border-line bg-navy p-2 text-sm" value={messageBody} onChange={(event) => setMessageBody(event.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/mechanic/jobs/${selected.jobId}`}>Open job</Link>
                    </Button>
                    <Button size="sm" variant="secondary" type="submit">
                      Message customer
                    </Button>
                  </div>
                </form>
              ) : null}
            </Card>
          ) : null}

          <MiniCalendar date={date} todayKey={todayKey} days={monthDays} />

          <Card className="p-4">
            <h2 className="font-semibold text-ink">Today’s Appointments</h2>
            <ul className="mt-3 space-y-2">
              {cards
                .filter((card) => card.kind === "WORK" || card.kind === "QC" || card.kind === "DROP_OFF")
                .slice()
                .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                .slice(0, 8)
                .map((card) => {
                  const start = new Date(card.startsAt);
                  const live = !isBlockedKind(card.kind) && intersectsNow(start, new Date(card.endsAt), now);
                  const badge = card.behind ? { label: "Late", tone: "text-danger bg-danger/15" } : live ? { label: "In Progress", tone: "text-warning bg-warning/15" } : start > now ? { label: "Upcoming", tone: "text-muted bg-navy" } : { label: "On Time", tone: "text-accent bg-accent/15" };
                  return (
                    <li key={card.id}>
                      <button type="button" onClick={() => setSelectedId(card.id)} className="flex w-full items-start justify-between gap-2 rounded-xl px-1 py-1 text-left hover:bg-navy/60">
                        <span>
                          <span className="number text-xs text-muted">{clock(start)}</span>
                          <span className="ml-2 text-sm font-semibold text-ink">{displayTitle(card.title)}</span>
                          <span className="block text-[11px] text-muted">
                            {card.assetLabel} {card.customerName ? `· ${card.customerName}` : ""}
                          </span>
                        </span>
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", badge.tone)}>{badge.label}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
            <Link href={`/mechanic/schedule?date=${date}&view=list`} className="mt-3 inline-block text-xs font-semibold text-accent">
              View all appointments
            </Link>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-ink">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" type="button" onClick={() => setComposer({ hour: shopStart, minute: 0, laneId: techs[0]?.id ?? "solo" })}>
                New Appointment
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => setComposer({ hour: 12, minute: 0, laneId: techs[0]?.id ?? "solo", kind: "BREAK" })}>
                Block Time
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => setComposer({ hour: shopStart, minute: 0, laneId: techs.find((tech) => tech.off)?.id ?? techs[0]?.id ?? "solo", kind: "PTO" })}>
                Time Off
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => window.print()}>
                Print Schedule
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <h2 className="font-semibold text-ink">Unscheduled Jobs</h2>
          <p className="text-[11px] text-muted">Drag onto the board. Customers are not booked automatically.</p>
          <ul className="mt-3 space-y-2">
            {unscheduled.length === 0 ? <li className="text-sm text-muted">Nothing waiting to schedule.</li> : null}
            {unscheduled.slice(0, 5).map((item) => (
              <li
                key={item.jobId}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/json", JSON.stringify({ type: "job", id: item.jobId, title: item.title, durationMin: item.hours * 60 }));
                }}
                className="cursor-grab rounded-xl border border-line bg-navy p-2 text-sm active:cursor-grabbing"
              >
                <p className="font-semibold">{displayTitle(item.title)}</p>
                  <p className="text-[11px] text-muted">
                    {item.asset} · {item.source.toLowerCase()}
                    {fillOpenHours ? ` · ${fillOpenHours}h open` : ""}
                  </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold text-ink">Upcoming (Next 7 Days)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.length === 0 ? <li className="text-muted">Nothing committed past today.</li> : null}
            {upcoming.map((item) => (
              <li key={item.id}>
                <Link href={`/mechanic/jobs/${item.id}`} className="font-semibold text-ink">
                  {item.assetLabel}
                </Link>
                <span className="block text-[11px] text-muted">
                  {new Date(item.when).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {item.title}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold text-ink">Availability</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {techs.map((tech) => (
              <li key={tech.id} className="flex items-center justify-between gap-2">
                <span>
                  {tech.name}
                  <span className="block text-[11px] text-muted">{tech.off ? "Time off" : `${tech.hoursStart} – ${tech.hoursEnd}`}</span>
                </span>
                <span className={cn("text-[11px] font-semibold", tech.off ? "text-danger" : "text-success")}>{tech.off ? "Time Off" : "Available"}</span>
              </li>
            ))}
          </ul>
          <textarea
            className="mt-3 min-h-16 w-full rounded-xl border border-line bg-navy p-2 text-xs"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              window.localStorage.setItem(`pm-day-notes-${date}`, event.target.value);
            }}
            placeholder="Day notes"
          />
        </Card>
      </div>

      {composer ? (
        <Card className="p-4">
          <h2 className="font-semibold text-ink">New appointment</h2>
          <form
            className="mt-3 grid gap-2 md:grid-cols-2"
            action={async (formData) => {
              const result = await createScheduleBlockAction(formData);
              if (!result.ok) setConflict({ message: result.error, retry: formData });
              else {
                setComposer(null);
                setToast({ text: "Appointment placed. Confirm with the customer before treating it as committed." });
                router.refresh();
              }
            }}
          >
            <input type="hidden" name="startsAt" value={new Date(`${date}T${String(composer.hour).padStart(2, "0")}:${String(composer.minute).padStart(2, "0")}:00`).toISOString()} />
            <input
              type="hidden"
              name="endsAt"
              value={new Date(new Date(`${date}T${String(composer.hour).padStart(2, "0")}:${String(composer.minute).padStart(2, "0")}:00`).getTime() + 90 * 60000).toISOString()}
            />
            {composer.laneId !== "solo" && lanes.find((lane) => lane.id === composer.laneId)?.kind !== "resource" ? <input type="hidden" name="technicianProfileId" value={composer.laneId} /> : null}
            {lanes.find((lane) => lane.id === composer.laneId)?.kind === "resource" ? <input type="hidden" name="resourceId" value={composer.laneId} /> : null}
            <Input name="title" required placeholder="Brake service" />
            <Select name="jobId" defaultValue="">
              <option value="">No linked job yet</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </Select>
            <Select name="kind" defaultValue={composer.kind ?? "WORK"}>
              <option value="WORK">Work</option>
              <option value="DROP_OFF">Drop-off</option>
              <option value="PICKUP">Pickup</option>
              {showTravel ? <option value="TRAVEL">Travel</option> : null}
              <option value="BREAK">Lunch / break</option>
              <option value="PTO">Time off</option>
              <option value="BUFFER">Buffer</option>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" type="submit">
                Create appointment
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => setComposer(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-sm shadow-[var(--shadow)]">
          <span>{toast.text}</span>
          {toast.undo ? (
            <button type="button" className="font-semibold text-accent" onClick={() => void undoMove()}>
              Undo
            </button>
          ) : null}
          <button type="button" className="text-muted" onClick={() => setToast(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {menu ? (
        <div
          className="fixed z-50 min-w-44 rounded-xl border border-line bg-card p-1 text-sm shadow-[var(--shadow)]"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {cards.find((card) => card.id === menu.id)?.jobId ? (
            <Link className="block rounded-lg px-3 py-2 hover:bg-slate" href={`/mechanic/jobs/${cards.find((card) => card.id === menu.id)?.jobId}`}>
              Open job
            </Link>
          ) : null}
          <button type="button" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate" onClick={() => { setSelectedId(menu.id); setMenu(null); }}>
            View details
          </button>
          <button
            type="button"
            className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate"
            onClick={() => {
              const card = cards.find((item) => item.id === menu.id);
              if (card) setComposer({ hour: new Date(card.startsAt).getHours(), minute: new Date(card.startsAt).getMinutes(), laneId: card.technicianProfileId ?? techs[0]?.id ?? "solo" });
              setMenu(null);
            }}
          >
            Reschedule
          </button>
        </div>
      ) : null}

      {conflict ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4">
          <Card className="max-w-md p-5">
            <h2 className="text-lg font-semibold text-ink">Scheduling conflict</h2>
            <p className="mt-2 text-sm text-muted">{conflict.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" type="button" onClick={() => setConflict(null)}>
                Choose different time
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => void overrideConflict()}>
                Override
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, hint, tone, children }: { label: string; value: ReactNode; hint?: string; tone?: "success" | "warning" | "danger"; children?: ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("number mt-1 text-2xl font-bold", tone === "danger" && "text-danger", tone === "warning" && "text-warning", tone === "success" && "text-success")}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
      {children}
    </Card>
  );
}

function LiveClock({ now }: { now: Date }) {
  return (
    <div className="hidden text-right sm:block">
      <p className="flex items-center justify-end gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
        <span className="pm-live-dot inline-block h-2 w-2 rounded-full bg-danger" />
        {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
      </p>
      <p className="number text-xl font-bold text-ink">{clock(now)}</p>
    </div>
  );
}

function JobBlock({
  card,
  now,
  timelineStart,
  hourPx,
  colorMode,
  offsite,
  selected,
  onSelect,
  onMenu,
  onResize,
}: {
  card: CommandCard;
  now: Date;
  timelineStart: number;
  hourPx: number;
  colorMode: ColorMode;
  offsite: boolean;
  selected: boolean;
  onSelect: () => void;
  onMenu: (event: ReactMouseEvent) => void;
  onResize: (endsAt: Date) => void;
}) {
  const start = new Date(card.startsAt);
  const end = new Date(card.endsAt);
  const top = minutesFromOpen(start, timelineStart) * (hourPx / 60);
  const height = Math.max(28, card.durationMin * (hourPx / 60) - 4);
  const compact = card.durationMin <= 30 || height < 44;
  const visual = visualTone({
    mode: colorMode,
    kind: card.kind,
    jobStatus: card.jobStatus,
    category: card.category,
    requestKind: card.requestKind,
    behind: card.behind,
    waiting: card.waiting,
    partsStatus: card.partsStatus,
    offsite: offsite && (card.kind === "TRAVEL" || card.kind === "WORK"),
    urgent: card.urgencyMode === "URGENT",
  });
  const live = !isBlockedKind(card.kind) && intersectsNow(start, end, now) && !card.behind;
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/json", JSON.stringify({ type: "block", id: card.id, title: card.title, durationMin: card.durationMin }));
      }}
      onClick={onSelect}
      onContextMenu={onMenu}
      className={cn(
        "absolute right-1 left-1 overflow-hidden rounded-xl border px-2 py-1 text-left text-xs",
        TONE_CLASS[visual.tone],
        live && "pm-job-active",
        card.behind && "pm-job-late",
        selected && "ring-2 ring-accent",
      )}
      style={{ top, height }}
    >
      <p className="truncate text-[10px] text-muted">{clock(start)} – {clock(end)}</p>
      <p className="truncate font-semibold leading-tight">{displayTitle(card.title)}</p>
      {compact ? null : (
        <>
          {card.assetLabel ? <p className="truncate text-[11px] text-muted">{card.assetLabel}</p> : null}
          {card.customerName && height > 64 ? <p className="truncate text-[11px] text-muted">{card.customerName}</p> : null}
          {card.behind ? <p className="text-[10px] font-semibold text-danger">Late</p> : null}
        </>
      )}
      <button
        type="button"
        aria-label="Resize duration"
        className="absolute right-1 bottom-0 left-1 h-2 cursor-ns-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const originY = event.clientY;
          const originEnd = end.getTime();
          function up(ev: MouseEvent) {
            window.removeEventListener("mouseup", up);
            const deltaMin = snapMinutes(((ev.clientY - originY) / hourPx) * 60, 15);
            const next = new Date(originEnd + deltaMin * 60000);
            if (next.getTime() - start.getTime() >= 15 * 60000 && deltaMin !== 0) onResize(next);
          }
          window.addEventListener("mouseup", up);
        }}
      />
    </article>
  );
}

function MiniCalendar({ date, todayKey, days }: { date: string; todayKey: string; days: { date: string; pct: number }[] }) {
  const focus = new Date(`${date}T12:00:00`);
  const start = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const pad = (start.getDay() + 6) % 7;
  const count = new Date(focus.getFullYear(), focus.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: pad + count }, (_, index) => {
    if (index < pad) return null;
    const day = index - pad + 1;
    const key = `${focus.getFullYear()}-${String(focus.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const mark = days.find((item) => item.date === key);
    return { day, key, pct: mark?.pct ?? 0 };
  });
  return (
    <Card className="p-4">
      <h2 className="font-semibold text-ink">{focus.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
        {cells.map((cell, index) =>
          cell ? (
            <Link
              key={cell.key}
              href={`/mechanic/schedule?date=${cell.key}`}
              className={cn(
                "rounded-lg py-1 text-[11px]",
                cell.key === date && "bg-accent text-white",
                cell.key === todayKey && cell.key !== date && "ring-1 ring-accent",
                cell.pct > 100 && cell.key !== date && "bg-danger/20 text-danger",
                cell.pct > 80 && cell.pct <= 100 && cell.key !== date && "bg-warning/15",
              )}
            >
              {cell.day}
            </Link>
          ) : (
            <span key={`empty-${index}`} />
          ),
        )}
      </div>
    </Card>
  );
}

function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function DraggableJob({ jobId, title, durationMin }: { jobId: string; title: string; durationMin: number }) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/json", JSON.stringify({ type: "job", id: jobId, title, durationMin }));
      }}
      className="cursor-grab rounded-xl border border-line p-2 text-sm active:cursor-grabbing"
    >
      {title}
    </div>
  );
}
