"use client";

import Link from "next/link";
import { useState } from "react";
import { scheduleAppointmentAction } from "@/app/actions/marketplace";
import { mechanicScheduleHref } from "@/lib/datetime";
import type { SchedulerJobCard, ScheduleView } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

let activeDrag: { jobId: string; time: string; durationMinutes?: number } | null = null;

export type BoardColumn = {
  label: string;
  date: string;
  hoursLabel: string;
  jobIds: string[];
  inMonth?: boolean;
};

export function CalendarViews({
  view,
  date,
  jobs,
  columns,
  movingJobId,
}: {
  view: "week" | "month";
  date: string;
  jobs: Record<string, SchedulerJobCard>;
  columns: BoardColumn[];
  movingJobId?: string;
}) {
  const [overDate, setOverDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const moving = movingJobId ? jobs[movingJobId] : undefined;
  const returnTo = mechanicScheduleHref({ view, date });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  async function dropOnDate(columnDate: string, payload: string) {
    const raw = payload || (activeDrag ? JSON.stringify(activeDrag) : "");
    if (!raw) return;
    let data: { jobId: string; time?: string; durationMinutes?: number };
    try {
      data = JSON.parse(raw) as { jobId: string; time?: string; durationMinutes?: number };
    } catch {
      if (!activeDrag) return;
      data = activeDrag;
    }
    if (!data.jobId) return;
    const form = new FormData();
    form.set("jobId", data.jobId);
    form.set("date", columnDate);
    form.set("time", data.time && /^\d{2}:\d{2}$/.test(data.time) ? data.time : "09:00");
    if (data.durationMinutes) form.set("durationMinutes", String(data.durationMinutes));
    form.set("returnTo", returnTo);
    setBusy(true);
    try {
      await scheduleAppointmentAction(form);
    } finally {
      setBusy(false);
      setOverDate(null);
      activeDrag = null;
    }
  }

  return (
    <div data-scheduler-view={view} className={cn("rounded-2xl border border-white/10 bg-[#0b1a2c] p-3", busy && "pointer-events-none opacity-70")}>
      {moving ? (
        <p className="mb-3 text-sm text-[#7eb0ff]">
          Moving {moving.customerName}. Park on a day or drag the block.
        </p>
      ) : null}
      {view === "month" ? (
        <div className="mb-1 hidden grid-cols-7 gap-2 md:grid">
          {weekdays.map((day) => (
            <p key={day} className="px-1 text-[11px] font-bold uppercase tracking-wide text-white/40">
              {day}
            </p>
          ))}
        </div>
      ) : null}
      <div className={view === "month" ? "grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7" : "grid gap-2 md:grid-cols-7"}>
        {columns.map((column) => (
          <DayCell
            key={column.date}
            column={column}
            jobs={jobs}
            date={date}
            view={view}
            moving={moving}
            movingJobId={movingJobId}
            over={overDate === column.date}
            returnTo={returnTo}
            onDragOver={() => setOverDate(column.date)}
            onDragLeave={() => setOverDate((current) => (current === column.date ? null : current))}
            onDrop={(payload) => void dropOnDate(column.date, payload)}
          />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  column,
  jobs,
  date,
  view,
  moving,
  movingJobId,
  over,
  returnTo,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  column: BoardColumn;
  jobs: Record<string, SchedulerJobCard>;
  date: string;
  view: "week" | "month";
  moving?: SchedulerJobCard;
  movingJobId?: string;
  over: boolean;
  returnTo: string;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (payload: string) => void;
}) {
  const compact = view === "month";
  const outside = compact && column.inMonth === false;
  const visibleIds = compact ? column.jobIds.slice(0, 3) : column.jobIds;
  const hidden = compact ? Math.max(0, column.jobIds.length - 3) : 0;
  return (
    <section
      data-date={column.date}
      data-in-month={column.inMonth === false ? "0" : "1"}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(event.dataTransfer.getData("application/json"));
      }}
      className={cn(
        "rounded-xl border p-2",
        compact ? "min-h-[9rem]" : "min-h-[16rem]",
        outside && "opacity-40",
        over || moving ? "border-[#2f7bff] bg-[#10263f]" : "border-white/10 bg-[#0d1c2e]",
      )}
    >
      {compact ? (
        <Link href={mechanicScheduleHref({ view: "day", date: column.date })} className="block">
          <p className="text-sm font-semibold text-white">{Number(column.date.slice(8))}</p>
          <p className="text-[11px] text-white/40">{column.hoursLabel}</p>
        </Link>
      ) : (
        <Link href={mechanicScheduleHref({ view: "day", date: column.date })} className="block">
          <p className="text-xs font-bold uppercase tracking-wide text-white/40">{column.label}</p>
          <p className="text-sm font-semibold text-white">{column.date.slice(5)}</p>
          <p className="mt-1 text-[11px] text-white/40">{column.hoursLabel}</p>
        </Link>
      )}
      {moving ? (
        <form action={scheduleAppointmentAction} className="mt-2">
          <input type="hidden" name="jobId" value={moving.id} />
          <input type="hidden" name="date" value={column.date} />
          <input type="hidden" name="time" value={moving.time} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit" name="parkJob" className="text-[11px] font-semibold text-[#7eb0ff]">
            Park here
          </button>
        </form>
      ) : null}
      <div className="mt-2 space-y-1.5">
        {visibleIds.map((id) => {
          const job = jobs[id];
          if (!job) return null;
          return <Chip key={id} job={job} date={date} view={view} moving={movingJobId === job.id} compact={compact} />;
        })}
        {hidden ? (
          <Link href={mechanicScheduleHref({ view: "week", date: column.date })} className="inline-block text-[11px] font-semibold text-[#7eb0ff]">
            +{hidden} more
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function Chip({
  job,
  date,
  view,
  moving,
  compact,
}: {
  job: SchedulerJobCard;
  date: string;
  view: ScheduleView;
  moving: boolean;
  compact: boolean;
}) {
  return (
    <div
      draggable
      data-job-id={job.id}
      onDragStart={(event) => {
        activeDrag = { jobId: job.id, time: job.time, durationMinutes: job.durationMinutes };
        event.dataTransfer.setData("application/json", JSON.stringify(activeDrag));
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn("rounded-md px-2 py-1.5 text-white", moving && "ring-2 ring-white")}
      style={{ background: job.color }}
    >
      <Link href={job.href} draggable={false} className="block">
        <p className="text-[11px] font-bold">{job.timeLabel ?? "—"}</p>
        <p className="truncate text-xs font-semibold">{compact ? job.title : job.customerName}</p>
        {compact ? null : <p className="truncate text-[10px] text-white/80">{job.title}</p>}
      </Link>
      <Link href={mechanicScheduleHref({ view, date, moving: job.id })} data-move-job={job.id} className="mt-1 inline-block text-[10px] font-semibold text-white/90">
        {moving ? "Picked" : "Move"}
      </Link>
    </div>
  );
}
