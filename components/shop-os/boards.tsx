"use client";

import Link from "next/link";
import { useState } from "react";
import { scheduleAppointmentAction } from "@/app/actions/marketplace";
import { denverClockMinutes, formatDenverDateInput, mechanicScheduleHref, minutesToClock } from "@/lib/datetime";
import {
  blockOffset,
  colorForBlock,
  minutesFromRatio,
  SCHEDULE_HOURS,
  SCHEDULE_SPAN_MIN,
  SCHEDULE_START_MIN,
  type SchedulerHoldCard,
  type SchedulerJobCard,
  type SchedulerResourceCard,
  type ScheduleView,
} from "@/lib/scheduler";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

let activeDrag: { jobId: string; time: string; durationMinutes?: number } | null = null;

const HOUR_SLOTS = SCHEDULE_HOURS.slice(0, -1);

function clockFromVertical(clientY: number, target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const ratio = rect.height <= 0 ? 0 : (clientY - rect.top) / rect.height;
  return minutesToClock(minutesFromRatio(ratio));
}

export function setShopDrag(job: { id: string; time: string; durationMinutes: number }) {
  activeDrag = { jobId: job.id, time: job.time || "09:00", durationMinutes: job.durationMinutes };
}

async function parkJob(input: {
  jobId: string;
  date: string;
  time: string;
  resourceId: string;
  durationMinutes?: number;
  view: ScheduleView;
}) {
  const form = new FormData();
  form.set("jobId", input.jobId);
  form.set("date", input.date);
  form.set("time", input.time);
  form.set("resourceId", input.resourceId);
  if (input.durationMinutes) form.set("durationMinutes", String(input.durationMinutes));
  form.set("returnTo", mechanicScheduleHref({ view: input.view, date: input.date }));
  await scheduleAppointmentAction(form);
}

export function ShopDayBoard({
  date,
  view = "day",
  resources,
  jobs,
  holds,
}: {
  date: string;
  view?: ScheduleView;
  resources: SchedulerResourceCard[];
  jobs: SchedulerJobCard[];
  holds: SchedulerHoldCard[];
}) {
  const techs = resources.filter((item) => item.kind === "TECH" || item.kind === "MOBILE");
  const columns = techs.length ? techs : resources;
  const booked = jobs.filter((job) => job.scheduledAt);
  const [busy, setBusy] = useState(false);
  const today = formatDenverDateInput(new Date()) === date;
  const nowMin = denverClockMinutes(new Date());
  const nowTop = ((nowMin - SCHEDULE_START_MIN) / SCHEDULE_SPAN_MIN) * 100;

  return (
    <div className={cn("overflow-x-auto", busy && "pointer-events-none opacity-70")}>
      <div className="min-w-[720px]">
        <div className="grid" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(140px, 1fr))` }}>
          <div />
          {columns.map((resource) => (
            <div key={resource.id} className="flex items-center gap-2 border-b border-[#eef3f8] px-3 py-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f7bff] text-[10px] font-bold text-white">
                {initials(resource.name.split(" ")[0], resource.name.split(" ")[1])}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-[#102033]">{resource.name}</p>
                <p className="truncate text-[10px] text-[#8a97a6]">{resource.role || resource.kind.toLowerCase()}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(140px, 1fr))` }}>
          <div>
            {HOUR_SLOTS.map((hour) => (
              <div key={hour} className="flex h-16 items-start justify-end pr-2 pt-1 text-[11px] font-semibold text-[#8a97a6]">
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>
          {columns.map((resource) => {
            const laneJobs = booked.filter((job) => job.resourceId === resource.id);
            const laneHolds = holds.filter((hold) => hold.resourceId === resource.id);
            return (
              <div
                key={resource.id}
                className="relative border-l border-[#eef3f8]"
                style={{ height: HOUR_SLOTS.length * 64 }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
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
                  setBusy(true);
                  void parkJob({
                    jobId: data.jobId,
                    date,
                    time: clockFromVertical(event.clientY, event.currentTarget),
                    resourceId: resource.id,
                    durationMinutes: data.durationMinutes,
                    view,
                  }).finally(() => setBusy(false));
                }}
              >
                {HOUR_SLOTS.map((hour) => (
                  <div key={hour} className="h-16 border-b border-[#eef3f8]" />
                ))}
                {laneHolds.map((hold) => {
                  const style = blockOffset(new Date(hold.startAt), hold.durationMinutes);
                  return (
                    <div
                      key={hold.id}
                      className="absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 text-[11px] font-semibold text-[#5c6b7a]"
                      style={{
                        top: style.left,
                        height: style.width,
                        background: `${colorForBlock(hold.kind)}18`,
                      }}
                    >
                      {hold.label}
                    </div>
                  );
                })}
                {laneJobs.map((job) => {
                  const style = blockOffset(new Date(job.scheduledAt!), job.durationMinutes);
                  return (
                    <Link
                      key={job.id}
                      href={`/mechanic/jobs?job=${job.id}`}
                      draggable
                      onDragStart={(event) => {
                        const payload = { jobId: job.id, time: job.time, durationMinutes: job.durationMinutes };
                        activeDrag = payload;
                        event.dataTransfer.setData("application/json", JSON.stringify(payload));
                      }}
                      className="absolute left-1 right-1 z-10 overflow-hidden rounded-lg px-2 py-1.5 shadow-sm"
                      style={{
                        top: style.left,
                        height: style.width,
                        background: `${job.color}22`,
                        borderLeft: `3px solid ${job.color}`,
                      }}
                    >
                      <p className="truncate text-[12px] font-bold text-[#102033]">{job.vehicleLabel}</p>
                      <p className="truncate text-[10px] text-[#5c6b7a]">{job.title}</p>
                      <p className="text-[10px] font-semibold text-[#5c6b7a]">{job.rangeLabel ?? job.timeLabel}</p>
                    </Link>
                  );
                })}
              </div>
            );
          })}
          {today && nowTop >= 0 && nowTop <= 100 ? (
            <div
              className="pointer-events-none absolute left-16 right-0 z-20 border-t-2 border-[#e23d3d]"
              style={{ top: `${nowTop}%` }}
            >
              <span className="absolute -left-14 -top-2.5 rounded bg-[#e23d3d] px-1.5 py-0.5 text-[10px] font-bold text-white">
                Now
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ShopWeekBoard({
  date,
  columns,
  resources,
  jobs,
  holds,
}: {
  date: string;
  columns: { label: string; date: string; hoursLabel: string; jobIds: string[] }[];
  resources: SchedulerResourceCard[];
  jobs: SchedulerJobCard[];
  holds: SchedulerHoldCard[];
}) {
  const techs = resources.filter((item) => item.kind === "TECH" || item.kind === "MOBILE");
  const rows = techs.length ? techs : resources;
  const [busy, setBusy] = useState(false);
  const today = formatDenverDateInput(new Date());

  return (
    <div className={cn("overflow-x-auto", busy && "pointer-events-none opacity-70")}>
      <div className="min-w-[980px]">
        <div className="grid border-b border-[#eef3f8]" style={{ gridTemplateColumns: `188px repeat(${columns.length}, minmax(110px, 1fr))` }}>
          <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#8a97a6]">
            Technicians ({rows.length})
          </div>
          {columns.map((column) => (
            <div
              key={column.date}
              className={cn("px-2 py-3 text-center", column.date === today && "bg-[#e8f1ff]")}
            >
              <p className="text-[11px] font-semibold text-[#8a97a6]">{column.label}</p>
              <p className={cn("text-[13px] font-bold", column.date === today ? "text-[#2f7bff]" : "text-[#102033]")}>
                {column.date.slice(5).replace("-", "/")}
              </p>
            </div>
          ))}
        </div>
        {rows.map((resource) => {
          const used = jobs.filter((job) => job.resourceId === resource.id && job.scheduledAt).length;
          const pct = Math.min(100, Math.round((used / Math.max(resource.capacityTotal, 1)) * 100));
          return (
            <div
              key={resource.id}
              className="grid border-b border-[#eef3f8]"
              style={{ gridTemplateColumns: `188px repeat(${columns.length}, minmax(110px, 1fr))` }}
            >
              <div className="flex items-center gap-2.5 px-4 py-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2f7bff] text-[11px] font-bold text-white">
                  {initials(resource.name.split(" ")[0], resource.name.split(" ")[1])}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#102033]">{resource.name}</p>
                  <p className="truncate text-[11px] text-[#8a97a6]">{resource.role || "Technician"}</p>
                  <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-[#eef3f8]">
                    <div className="h-full rounded-full bg-[#2f7bff]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              {columns.map((column) => {
                const cellJobs = jobs.filter(
                  (job) => job.resourceId === resource.id && job.scheduledAt && formatDenverDateInput(new Date(job.scheduledAt)) === column.date,
                );
                const cellHolds = holds.filter(
                  (hold) => hold.resourceId === resource.id && formatDenverDateInput(new Date(hold.startAt)) === column.date,
                );
                return (
                  <div
                    key={`${resource.id}-${column.date}`}
                    className={cn("min-h-[92px] space-y-1 border-l border-[#eef3f8] p-1.5", column.date === today && "bg-[#f7faff]")}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
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
                      setBusy(true);
                      void parkJob({
                        jobId: data.jobId,
                        date: column.date,
                        time: data.time || "09:00",
                        resourceId: resource.id,
                        durationMinutes: data.durationMinutes,
                        view: "week",
                      }).finally(() => setBusy(false));
                    }}
                  >
                    {cellHolds.map((hold) => (
                      <div key={hold.id} className="rounded-md bg-[#eef3f8] px-1.5 py-1 text-[10px] font-semibold text-[#5c6b7a]">
                        {hold.label}
                      </div>
                    ))}
                    {cellJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/mechanic/jobs?job=${job.id}`}
                        draggable
                        onDragStart={(event) => {
                          const payload = { jobId: job.id, time: job.time, durationMinutes: job.durationMinutes };
                          activeDrag = payload;
                          event.dataTransfer.setData("application/json", JSON.stringify(payload));
                        }}
                        className="block overflow-hidden rounded-md px-1.5 py-1"
                        style={{ background: `${job.color}22`, borderLeft: `3px solid ${job.color}` }}
                      >
                        <p className="truncate text-[11px] font-bold text-[#102033]">{job.vehicleLabel}</p>
                        <p className="truncate text-[10px] text-[#5c6b7a]">{job.title}</p>
                        <p className="text-[10px] font-semibold text-[#5c6b7a]">{job.timeLabel}</p>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ShopMonthBoard({
  columns,
  jobs,
}: {
  columns: { label: string; date: string; hoursLabel: string; jobIds: string[]; inMonth?: boolean }[];
  jobs: SchedulerJobCard[];
}) {
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-[#e6eef6]">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="border-b border-[#eef3f8] bg-[#f8fafc] px-2 py-2 text-center text-[11px] font-bold text-[#8a97a6]">
          {day}
        </div>
      ))}
      {columns.map((column) => {
        const dayJobs = jobs.filter((job) => job.scheduledAt && formatDenverDateInput(new Date(job.scheduledAt)) === column.date);
        return (
          <Link
            key={column.date}
            href={mechanicScheduleHref({ view: "day", date: column.date })}
            className={cn(
              "min-h-[92px] border-b border-r border-[#eef3f8] p-2",
              column.inMonth === false && "bg-[#f8fafc] text-[#b0bac4]",
            )}
          >
            <p className="text-[12px] font-bold">{column.date.slice(8)}</p>
            <div className="mt-1 space-y-1">
              {dayJobs.slice(0, 3).map((job) => (
                <p key={job.id} className="truncate rounded px-1 text-[10px] font-semibold" style={{ background: `${job.color}22` }}>
                  {job.vehicleLabel}
                </p>
              ))}
              {dayJobs.length > 3 ? <p className="text-[10px] text-[#8a97a6]">+{dayJobs.length - 3} more</p> : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function UnscheduledChip({ job }: { job: SchedulerJobCard }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        const payload = { jobId: job.id, time: job.time || "09:00", durationMinutes: job.durationMinutes };
        activeDrag = payload;
        event.dataTransfer.setData("application/json", JSON.stringify(payload));
      }}
      className="w-full rounded-xl border border-dashed border-[#dbe3ec] bg-white px-3 py-2 text-left"
    >
      <p className="truncate text-[13px] font-bold text-[#102033]">{job.title}</p>
      <p className="truncate text-[11px] text-[#6b7c8d]">
        {job.vehicleLabel} · {job.customerName}
      </p>
    </button>
  );
}
