"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  fillOpenHours,
  jobs,
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
  };
  attention: { href: string; label: string; tone: string }[];
  techs: CommandTech[];
  resources: CommandResource[];
  cards: CommandCard[];
  unscheduled: UnscheduledItem[];
  arrivals: { id: string; time: string; customerName: string | null; assetLabel: string | null; checkIn: string; jobId: string | null }[];
  upcoming: { id: string; title: string; when: string; assetLabel: string; cents: number; kind: string }[];
  fillOpenHours: number;
  jobs: { id: string; label: string }[];
}) {
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const nowLine = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [density, setDensity] = useState<Density>("standard");
  const [colorMode, setColorMode] = useState<ColorMode>("status");
  const [laneMode, setLaneMode] = useState<"techs" | "bays">(showBays && !showTravel ? "techs" : "techs");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [legendOpen, setLegendOpen] = useState(true);
  const [composer, setComposer] = useState<{ hour: number; minute: number; laneId: string } | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: { id: string; startsAt: string; endsAt: string; technicianProfileId: string | null; resourceId: string | null } } | null>(null);
  const [conflict, setConflict] = useState<{ message: string; retry: FormData } | null>(null);
  const [notes, setNotes] = useState("");
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
    if (laneMode === "bays" && resources.length) {
      return resources.map((item) => ({
        id: item.id,
        name: item.name,
        subtitle: item.kind.replaceAll("_", " ").toLowerCase(),
        kind: "resource" as const,
        pct: null as number | null,
        current: cards.find((card) => card.resourceId === item.id && new Date(card.startsAt) <= now && new Date(card.endsAt) > now)?.title ?? null,
        off: false,
        hours: "",
      }));
    }
    return techs.map((tech) => ({
      id: tech.id,
      name: tech.name,
      subtitle: tech.off ? "Time off" : tech.currentTitle ? `Current: ${tech.currentTitle}` : tech.title || tech.duty.replaceAll("_", " ").toLowerCase(),
      kind: "tech" as const,
      pct: tech.pct,
      current: tech.currentTitle,
      off: tech.off,
      hours: `${tech.hoursStart}–${tech.hoursEnd}`,
    }));
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Live operations</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">How the operation is running</h1>
          <p className="mt-1 text-sm text-muted">
            {showTravel && !showBays ? "You travel to customers / assets." : showBays && !showTravel ? "Customers bring assets to your location." : "Shop and off-site work."}{" "}
            Pocket Mechanic never silently auto-books or rearranges confirmed work.
          </p>
        </div>
        <LiveClock now={now} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Metric label="Appointments" value={header.appointments} />
        <Metric label="In progress" value={header.inProgress} tone="success" />
        <Metric label="Waiting on parts" value={header.waitingOnParts} tone="warning" />
        <Metric label="Waiting approval" value={header.awaitingApproval} tone="warning" />
        <Metric label="Running late" value={header.behind} tone="danger" />
        <Metric label="Ready" value={header.ready} tone="success" />
        <Metric label="Arriving soon" value={header.arrivingSoon} />
        <Metric label="Shop utilization" value={`${header.utilization}%`} hint={`${header.openHours}h open`} />
      </div>

      {attention.length ? (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-[11px] font-semibold uppercase tracking-[0.14em] text-warning">Needs attention</span>
          {attention.slice(0, 8).map((item) => (
            <Link key={item.href + item.label} href={item.href} className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-ink">
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={date === todayKey ? "primary" : "secondary"}>
          <Link href="/mechanic/schedule">Today</Link>
        </Button>
        <Button size="sm" variant="secondary" type="button" onClick={scrollNow}>
          Now
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/mechanic/schedule?date=${shiftDate(date, -1)}`}>Previous</Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/mechanic/schedule?date=${shiftDate(date, 1)}`}>Next</Link>
        </Button>
        <span className="text-sm font-semibold text-ink">
          {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </span>
        <span className="ml-auto" />
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
          className="h-9 w-40"
        >
          <option value="status">Color by status</option>
          <option value="type">Color by service</option>
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
        {showBays ? (
          <div className="flex rounded-xl border border-line">
            <button type="button" className={cn("px-3 py-1.5 text-xs font-semibold", laneMode === "techs" ? "bg-accent text-white" : "text-muted")} onClick={() => setLaneMode("techs")}>
              Technicians
            </button>
            <button type="button" className={cn("px-3 py-1.5 text-xs font-semibold", laneMode === "bays" ? "bg-accent text-white" : "text-muted")} onClick={() => setLaneMode("bays")}>
              Service bays
            </button>
          </div>
        ) : null}
        <Button size="sm" type="button" onClick={() => setComposer({ hour: shopStart, minute: 0, laneId: techs[0]?.id ?? "solo" })}>
          + New
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card className="overflow-hidden p-0">
          <div ref={scroller} className="relative max-h-[78vh] overflow-auto">
            <div className="sticky top-0 z-30 grid border-b border-line bg-navy/95 backdrop-blur" style={{ gridTemplateColumns: `4.5rem repeat(${Math.max(lanes.length, 1)}, minmax(11rem, 1fr))` }}>
              <div className="px-2 py-3 text-[10px] uppercase tracking-wide text-muted">Time</div>
              {lanes.map((lane) => (
                <div key={lane.id} className="border-l border-line px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate text-xs font-bold">{lane.name.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{lane.name}</p>
                      <p className="text-[11px] text-muted">{lane.subtitle}</p>
                    </div>
                  </div>
                  {lane.pct != null ? (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-soft">
                      <div className={cn("h-full rounded-full", lane.pct > 100 ? "bg-danger" : lane.pct > 85 ? "bg-warning" : "bg-accent")} style={{ width: `${Math.min(100, lane.pct)}%` }} />
                    </div>
                  ) : null}
                  {lane.pct != null ? <p className="mt-1 text-[10px] text-muted">{lane.off ? "Off" : `${lane.pct}% booked · ${lane.hours}`}</p> : null}
                </div>
              ))}
            </div>
            <div className="relative" style={{ height }}>
              {Array.from({ length: totalHours + 1 }, (_, index) => timelineStart + index).map((hour) => {
                const closed = hour < shopStart || hour >= shopEnd;
                return (
                  <div key={hour} className={cn("absolute right-0 left-0 border-t border-line/80", closed && "bg-navy/50")} style={{ top: (hour - timelineStart) * hourPx, height: hourPx }}>
                    <span className="number absolute left-2 top-1 text-[11px] text-muted">{hour}:00</span>
                  </div>
                );
              })}
              {showNow ? (
                <div ref={nowLine} className="pm-now-line absolute right-0 left-0" style={{ top: nowTop }}>
                  <span className="absolute -top-3 left-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">{clock(now)}</span>
                </div>
              ) : null}
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `4.5rem repeat(${Math.max(lanes.length, 1)}, minmax(11rem, 1fr))` }}>
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
                        if (laneMode === "bays") return card.resourceId === lane.id || (!card.resourceId && lane.id === resources[0]?.id && !card.technicianProfileId);
                        if (lane.id === "solo") return true;
                        if (card.technicianProfileId) return card.technicianProfileId === lane.id;
                        return lane.id === lanes[0]?.id;
                      })
                      .map((card) => (
                        <JobBlock
                          key={card.id}
                          card={card}
                          timelineStart={timelineStart}
                          hourPx={hourPx}
                          colorMode={colorMode}
                          offsite={showTravel}
                          selected={selectedId === card.id}
                          onSelect={() => setSelectedId(card.id)}
                          onResize={async (endsAt) => {
                            const form = new FormData();
                            form.set("blockId", card.id);
                            form.set("startsAt", card.startsAt);
                            form.set("endsAt", endsAt.toISOString());
                            if (card.technicianProfileId) form.set("technicianProfileId", card.technicianProfileId);
                            const result = await moveScheduleBlockAction(form);
                            if (!result.ok) setConflict({ message: result.error, retry: form });
                            else {
                              setToast({ text: `${card.title} duration updated.`, undo: { id: card.id, startsAt: card.startsAt, endsAt: card.endsAt, technicianProfileId: card.technicianProfileId, resourceId: card.resourceId } });
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
              <h2 className="mt-1 text-lg font-semibold text-ink">{selected.title.replace(/^Demo:\s/, "")}</h2>
              <p className="text-sm text-muted">
                {selected.assetLabel} {selected.customerName ? `· ${selected.customerName}` : ""}
              </p>
              <p className="mt-2 text-xs text-muted">
                {clock(new Date(selected.startsAt))}–{clock(new Date(selected.endsAt))} · {selected.technicianName ?? "Unassigned"}
                {selected.resourceName ? ` · ${selected.resourceName}` : ""}
              </p>
              <p className="mt-2 text-sm">
                Job {selected.jobStatus?.replaceAll("_", " ").toLowerCase() ?? "unlinked"} · {selected.progressLabel}
                {selected.behind ? ` · running late +${selected.minutesBehind} min` : ""}
              </p>
              {selected.complaint ? <p className="mt-2 text-sm text-muted">{selected.complaint}</p> : null}
              {selected.slip ? <p className="mt-2 text-xs text-danger">Schedule at risk · {selected.slip.message}</p> : null}
              {selected.potentiallyDelayed ? <p className="mt-2 text-xs text-warning">Potentially delayed. Customer has not been notified.</p> : null}
              <p className="mt-2 text-[11px] uppercase tracking-wide text-muted">
                {selected.source.toLowerCase()} · parts {selected.partsStatus.toLowerCase()} · {selected.checkIn.replaceAll("_", " ").toLowerCase()}
              </p>
              {selected.jobId ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/mechanic/jobs/${selected.jobId}`}>Open job</Link>
                  </Button>
                  <form action={sendScheduleUpdateAction}>
                    <input type="hidden" name="jobId" value={selected.jobId} />
                    <input type="hidden" name="body" value={scheduleMessageTemplate(selected.behind ? "BEHIND" : selected.checkIn === "CHECKED_IN" ? "READY" : "READY")} />
                    <Button size="sm" variant="secondary" type="submit">
                      Message customer
                    </Button>
                  </form>
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card className="p-4">
            <h2 className="font-semibold text-ink">Arrivals</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {arrivals.length === 0 ? <li className="text-muted">No arrivals on the board.</li> : null}
              {arrivals.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>
                    <span className="number text-muted">{clock(new Date(item.time))}</span> {item.customerName}
                    <span className="block text-[11px] text-muted">{item.assetLabel}</span>
                  </span>
                  <span className="text-[11px] uppercase text-muted">{item.checkIn.replaceAll("_", " ")}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-ink">Unscheduled</h2>
            <p className="text-[11px] text-muted">{fillOpenHours} hours open. Drag onto a lane. Customers are not booked automatically.</p>
            <ul className="mt-3 space-y-2">
              {unscheduled.map((item) => (
                <li
                  key={item.jobId}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/json", JSON.stringify({ type: "job", id: item.jobId, title: item.title, durationMin: item.hours * 60 }));
                  }}
                  className="cursor-grab rounded-xl border border-line bg-navy p-2 text-sm active:cursor-grabbing"
                >
                  <p className="font-semibold">{item.asset}</p>
                  <p className="text-[11px] text-muted">
                    {item.source} · {item.hours}h · {item.recommendedTech}
                  </p>
                  <Link className="text-xs font-semibold text-accent" href={item.fitHref}>
                    Smart Fit
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-ink">Upcoming — 7 days</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted">
              {upcoming.length === 0 ? <li>Nothing committed past today.</li> : null}
              {upcoming.map((item) => (
                <li key={item.id}>
                  <Link href={`/mechanic/jobs/${item.id}`} className="text-ink">
                    {item.assetLabel}
                  </Link>
                  <span className="block text-[11px]">
                    {new Date(item.when).toLocaleDateString()} · {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <button type="button" className="text-sm font-semibold text-ink" onClick={() => setLegendOpen((open) => !open)}>
              Legend {legendOpen ? "▾" : "▸"}
            </button>
            {legendOpen ? (
              <ul className="mt-2 space-y-1 text-xs text-muted">
                <li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent" /> Blue — scheduled</li>
                <li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-purple" /> Purple — diagnostics</li>
                <li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-warning" /> Amber — waiting</li>
                <li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-success" /> Green — in progress / ready</li>
                <li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-danger" /> Red — late / urgent</li>
                <li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-muted" /> Gray — lunch / blocked / travel</li>
              </ul>
            ) : null}
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-ink">Day notes</h2>
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border border-line bg-navy p-2 text-sm"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                window.localStorage.setItem(`pm-day-notes-${date}`, event.target.value);
              }}
              placeholder="Mike leaves at 3. Parts truck at 10:30."
            />
          </Card>
        </aside>
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
            {composer.laneId !== "solo" && laneMode === "techs" ? <input type="hidden" name="technicianProfileId" value={composer.laneId} /> : null}
            {laneMode === "bays" ? <input type="hidden" name="resourceId" value={composer.laneId} /> : null}
            <Input name="title" required placeholder="Brake service" />
            <Select name="jobId" defaultValue="">
              <option value="">No linked job yet</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </Select>
            <Select name="kind" defaultValue="WORK">
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

function Metric({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "success" | "warning" | "danger" }) {
  return (
    <Card className="p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={cn("number mt-1 text-xl font-bold", tone === "danger" && "text-danger", tone === "warning" && "text-warning", tone === "success" && "text-success")}>{value}</p>
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </Card>
  );
}

function LiveClock({ now }: { now: Date }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3 text-right">
      <p className="flex items-center justify-end gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
        <span className="pm-live-dot inline-block h-2 w-2 rounded-full bg-danger" />
        Shop time
      </p>
      <p className="number text-2xl font-bold text-ink">{clock(now)}</p>
      <p className="text-xs text-muted">{now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
    </div>
  );
}

function JobBlock({
  card,
  timelineStart,
  hourPx,
  colorMode,
  offsite,
  selected,
  onSelect,
  onResize,
}: {
  card: CommandCard;
  timelineStart: number;
  hourPx: number;
  colorMode: ColorMode;
  offsite: boolean;
  selected: boolean;
  onSelect: () => void;
  onResize: (endsAt: Date) => void;
}) {
  const start = new Date(card.startsAt);
  const end = new Date(card.endsAt);
  const top = minutesFromOpen(start, timelineStart) * (hourPx / 60);
  const height = Math.max(28, card.durationMin * (hourPx / 60) - 4);
  const compact = card.durationMin <= 30;
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
  const active = card.inProgress && !card.behind;
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/json", JSON.stringify({ type: "block", id: card.id, title: card.title, durationMin: card.durationMin }));
      }}
      onClick={onSelect}
      onContextMenu={(event) => {
        event.preventDefault();
        onSelect();
      }}
      className={cn(
        "absolute right-1 left-1 overflow-hidden rounded-xl border px-2 py-1 text-left text-xs",
        TONE_CLASS[visual.tone],
        active && "pm-job-active",
        card.behind && "pm-job-late",
        selected && "ring-2 ring-accent",
      )}
      style={{ top, height }}
    >
      <p className="font-semibold leading-tight">{card.title.replace(/^Demo:\s/, "")}</p>
      {!compact ? (
        <>
          {card.assetLabel ? <p className="truncate text-[11px] text-muted">{card.assetLabel}</p> : null}
          <p className="text-[10px] uppercase tracking-wide text-muted">
            {clock(start)}–{clock(end)}
            {card.behind ? ` · running late +${card.minutesBehind} min` : ""}
            {card.inProgress ? " · in progress" : ""}
            {card.waiting ? " · waiting" : ""}
            {card.source === "MARKETPLACE" || card.source === "FLEET" ? ` · ${card.source.toLowerCase()}` : ""}
          </p>
          {card.kind === "WORK" || card.inProgress ? (
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-navy/40">
              <div className="h-full bg-white/70" style={{ width: `${card.progressPct}%` }} />
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-[10px] text-muted">
          {clock(start)} {card.assetLabel}
        </p>
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
