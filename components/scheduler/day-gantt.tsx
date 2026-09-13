"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { scheduleAppointmentAction } from "@/app/actions/marketplace";
import { clockFromEvent, colorForBlock, SCHEDULE_HOURS, SCHEDULE_START_HOUR } from "@/lib/scheduler";
import { mechanicScheduleHref } from "@/lib/datetime";
import { blockOffset } from "@/lib/scheduler";
import { cn } from "@/lib/utils";
import type { SchedulerHoldCard, SchedulerJobCard, SchedulerResourceCard, ScheduleView } from "@/lib/scheduler";

let activeDrag: { jobId: string; time: string; durationMinutes?: number } | null = null;

export function DayGantt({
  date,
  view,
  resources,
  jobs,
  holds,
  movingJobId,
  origin,
}: {
  date: string;
  view: ScheduleView;
  resources: SchedulerResourceCard[];
  jobs: SchedulerJobCard[];
  holds: SchedulerHoldCard[];
  movingJobId?: string;
  origin: { latitude: number; longitude: number; label: string };
}) {
  const [overLane, setOverLane] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const moving = movingJobId ? jobs.find((job) => job.id === movingJobId) : undefined;
  const booked = jobs.filter((job) => job.scheduledAt);
  const hourSlots = SCHEDULE_HOURS.slice(0, -1);

  async function park(resourceId: string, time: string, jobId: string, durationMinutes?: number) {
    const form = new FormData();
    form.set("jobId", jobId);
    form.set("date", date);
    form.set("time", time);
    form.set("resourceId", resourceId);
    if (durationMinutes) form.set("durationMinutes", String(durationMinutes));
    form.set("returnTo", mechanicScheduleHref({ view, date }));
    setBusy(true);
    try {
      await scheduleAppointmentAction(form);
    } finally {
      setBusy(false);
      setOverLane(null);
      activeDrag = null;
    }
  }

  return (
    <div
      data-day-gantt
      className={cn("relative overflow-x-auto rounded-2xl border border-white/10 bg-[#0b1a2c]", busy && "pointer-events-none opacity-70")}
    >
      <div className="relative min-w-[1100px]">
        <div className="grid grid-cols-[220px_1fr] border-b border-white/10">
          <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-white/35">Team</div>
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${hourSlots.length}, minmax(0, 1fr))` }}>
            {hourSlots.map((hour) => (
              <p key={hour} className="px-1 py-3 text-center text-[11px] font-semibold text-white/45">
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </p>
            ))}
            <p className="pointer-events-none absolute right-1 top-3 text-[11px] font-semibold text-white/45">6 PM</p>
          </div>
        </div>
        <NowLine date={date} />
        {resources.map((resource) => {
          const laneJobs = booked.filter((job) => job.resourceId === resource.id);
          const laneHolds = holds.filter((hold) => hold.resourceId === resource.id);
          const mobileStops = resource.kind === "MOBILE" ? laneJobs : [];
          return (
            <div key={resource.id} className="border-b border-white/8">
              <div className="grid grid-cols-[220px_1fr]">
                <ResourceCell resource={resource} />
                <div
                  data-lane={resource.id}
                  className={cn("relative h-[78px]", overLane === resource.id || moving ? "bg-[#2f7bff]/8" : "bg-transparent")}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setOverLane(resource.id);
                  }}
                  onDragLeave={() => setOverLane((current) => (current === resource.id ? null : current))}
                  onDrop={(event) => {
                    event.preventDefault();
                    const payload = event.dataTransfer.getData("application/json");
                    let data = activeDrag;
                    try {
                      data = JSON.parse(payload) as typeof activeDrag;
                    } catch {
                      data = activeDrag;
                    }
                    if (!data?.jobId) return;
                    void park(resource.id, clockFromEvent(event.clientX, event.currentTarget), data.jobId, data.durationMinutes);
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${hourSlots.length}, minmax(0, 1fr))` }}>
                    {hourSlots.map((hour) => (
                      <div key={hour} className="border-r border-white/6" />
                    ))}
                  </div>
                  {moving ? (
                    <div className="absolute inset-0 z-20 grid" style={{ gridTemplateColumns: `repeat(${hourSlots.length}, minmax(0, 1fr))` }}>
                      {hourSlots.map((hour) => (
                        <form key={`${resource.id}-${hour}`} action={scheduleAppointmentAction} className="flex items-end justify-center pb-1">
                          <input type="hidden" name="jobId" value={moving.id} />
                          <input type="hidden" name="date" value={date} />
                          <input type="hidden" name="time" value={`${String(hour).padStart(2, "0")}:00`} />
                          <input type="hidden" name="resourceId" value={resource.id} />
                          <input type="hidden" name="durationMinutes" value={String(moving.durationMinutes)} />
                          <input type="hidden" name="returnTo" value={mechanicScheduleHref({ view, date })} />
                          <button type="submit" name="parkJob" className="rounded bg-[#2f7bff]/20 px-1 text-[10px] font-semibold text-[#9cc4ff]">
                            Park
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                  {laneHolds.map((hold) => {
                    const style = blockOffset(new Date(hold.startAt), hold.durationMinutes);
                    return (
                      <div
                        key={hold.id}
                        data-hold={hold.id}
                        className="absolute top-2 z-10 overflow-hidden rounded-md px-2 py-1 text-[11px] font-semibold text-white/70"
                        style={{ left: style.left, width: style.width, background: colorForBlock(hold.kind), height: 54 }}
                      >
                        <p>{hold.label}</p>
                        <p className="text-[10px] font-medium text-white/45">{hold.time}</p>
                      </div>
                    );
                  })}
                  {laneJobs.map((job) => {
                    const style = blockOffset(new Date(job.scheduledAt!), job.durationMinutes);
                    return <JobBlock key={job.id} job={job} date={date} view={view} moving={movingJobId === job.id} style={style} />;
                  })}
                </div>
              </div>
              {resource.kind === "MOBILE" && mobileStops.length ? (
                <div className="grid grid-cols-[220px_1fr] bg-[#071422]/80">
                  <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white/40">
                    Route ({mobileStops.length} stop{mobileStops.length === 1 ? "" : "s"})
                  </p>
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                    {mobileStops.map((job, index) => (
                      <Link
                        key={job.id}
                        href={job.href}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/80"
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2f7bff] text-[10px] font-bold">
                          {index + 1}
                        </span>
                        {job.vehicleLabel}
                        {job.city ? ` · ${job.city}` : ""}
                      </Link>
                    ))}
                    <a href={routeHref(origin, mobileStops)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-[#7eb0ff]">
                      View Route
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResourceCell({ resource }: { resource: SchedulerResourceCard }) {
  const letter = resource.name.charAt(0).toUpperCase();
  const bay = resource.kind !== "TECH";
  return (
    <div className="flex items-center gap-3 border-r border-white/10 px-3 py-2">
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold",
          bay ? "rounded-lg bg-white/10 text-white/80" : "rounded-full bg-[#2f7bff] text-white",
        )}
      >
        {bay ? (resource.kind === "MOBILE" ? "M" : "B") : letter}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-white">{resource.name}</p>
          <span className="text-[10px] font-semibold text-white/35">
            {resource.capacityUsed}/{resource.capacityTotal}
          </span>
        </div>
        <p className="truncate text-[11px] text-white/45">{resource.role}</p>
        <p className="truncate text-[11px] text-[#7eb0ff]">{resource.statusLabel}</p>
      </div>
    </div>
  );
}

function JobBlock({
  job,
  date,
  view,
  moving,
  style,
}: {
  job: SchedulerJobCard;
  date: string;
  view: ScheduleView;
  moving: boolean;
  style: { left: string; width: string };
}) {
  return (
    <article
      draggable
      data-job-id={job.id}
      onDragStart={(event) => {
        activeDrag = { jobId: job.id, time: job.time, durationMinutes: job.durationMinutes };
        event.dataTransfer.setData("application/json", JSON.stringify(activeDrag));
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "absolute top-2 z-10 overflow-hidden rounded-md px-2 py-1 text-white shadow-[0_8px_18px_rgba(0,0,0,0.28)]",
        moving && "ring-2 ring-white",
      )}
      style={{ left: style.left, width: style.width, background: job.color, height: 54 }}
    >
      <Link href={job.href} draggable={false} className="block min-w-0">
        <p className="truncate text-[12px] font-bold leading-tight">{job.title}</p>
        <p className="truncate text-[10px] text-white/80">{job.vehicleLabel}</p>
        <p className="truncate text-[10px] text-white/70">{job.rangeLabel}</p>
      </Link>
      <Link href={mechanicScheduleHref({ view, date, moving: job.id })} data-move-job={job.id} className="text-[10px] font-semibold text-white/90">
        {moving ? "Picked" : "Move"}
      </Link>
    </article>
  );
}

function NowLine({ date }: { date: string }) {
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Denver",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
      const ymd = `${value("year")}-${value("month")}-${value("day")}`;
      if (ymd !== date) {
        setPct(null);
        return;
      }
      const minutes = Number(value("hour")) * 60 + Number(value("minute"));
      const start = SCHEDULE_START_HOUR * 60;
      const span = 11 * 60;
      if (minutes < start || minutes > start + span) {
        setPct(null);
        return;
      }
      setPct(((minutes - start) / span) * 100);
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [date]);
  if (pct == null) return null;
  return (
    <div data-now-line className="pointer-events-none absolute bottom-0 top-0 z-30 ml-[220px] w-[calc(100%-220px)]">
      <div className="absolute top-0 h-full w-px bg-[#e23d3d]" style={{ left: `${pct}%` }}>
        <span className="absolute -left-8 top-2 rounded bg-[#e23d3d] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {clockLabel(pct)}
        </span>
      </div>
    </div>
  );
}

function clockLabel(pct: number) {
  const minutes = Math.round(SCHEDULE_START_HOUR * 60 + (pct / 100) * 11 * 60);
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(min).padStart(2, "0")} ${suffix}`;
}

function routeHref(origin: { latitude: number; longitude: number }, stops: SchedulerJobCard[]) {
  const points = stops.filter((stop) => stop.latitude != null && stop.longitude != null) as (SchedulerJobCard & {
    latitude: number;
    longitude: number;
  })[];
  const dest = points.at(-1);
  if (!dest) return `https://www.google.com/maps/search/?api=1&query=${origin.latitude},${origin.longitude}`;
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${dest.latitude},${dest.longitude}`,
    travelmode: "driving",
  });
  const waypoints = points
    .slice(0, -1)
    .map((stop) => `${stop.latitude},${stop.longitude}`)
    .join("|");
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
