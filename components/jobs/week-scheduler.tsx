"use client";

import Link from "next/link";
import { useState } from "react";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { scheduleAppointmentAction } from "@/app/actions/marketplace";
import { mechanicScheduleHref } from "@/lib/datetime";
import type { JobStatus } from "@prisma/client";

export type SchedulerJob = {
  id: string;
  href: string;
  customerName: string;
  problem: string;
  vehicleLabel: string;
  status: JobStatus;
  time: string;
  timeLabel: string | null;
};

export type SchedulerColumn = {
  label: string;
  date: string;
  hoursLabel: string;
  jobIds: string[];
  inMonth?: boolean;
};

let activeDrag: { jobId: string; time: string } | null = null;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_JOBS = 3;

export function WeekScheduler({
  jobs,
  columns,
  unscheduled,
  week,
  view = "week",
  movingJobId,
}: {
  jobs: Record<string, SchedulerJob>;
  columns: SchedulerColumn[];
  unscheduled: SchedulerJob[];
  week: string;
  view?: "week" | "month";
  movingJobId?: string;
}) {
  const [overDate, setOverDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const moving = movingJobId ? jobs[movingJobId] : null;
  const returnTo = mechanicScheduleHref({ view, week });

  async function dropOnDate(date: string, payload: string) {
    const raw = payload || (activeDrag ? JSON.stringify(activeDrag) : "");
    if (!raw) return;
    let data: { jobId: string; time?: string };
    try {
      data = JSON.parse(raw) as { jobId: string; time?: string };
    } catch {
      if (!activeDrag) return;
      data = activeDrag;
    }
    if (!data.jobId) return;
    const form = new FormData();
    form.set("jobId", data.jobId);
    form.set("date", date);
    form.set("time", data.time && /^\d{2}:\d{2}$/.test(data.time) ? data.time : "09:00");
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
    <div data-scheduler-view={view} className={busy ? "pointer-events-none opacity-70" : undefined}>
      {unscheduled.length ? (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold text-navy">Needs a time</h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unscheduled.map((job) => (
              <SchedulerCard key={job.id} job={job} week={week} view={view} moving={movingJobId === job.id} />
            ))}
          </div>
        </section>
      ) : null}

      {moving ? (
        <p className="mb-3 text-sm text-[#7eb0ff]">
          Moving {moving.customerName}. Drag onto a day or use Park here.
        </p>
      ) : null}

      {view === "month" ? (
        <div className="mb-1 hidden grid-cols-7 gap-2 md:grid">
          {WEEKDAYS.map((day) => (
            <p key={day} className="px-1 text-xs font-bold uppercase tracking-wide text-muted">
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
            week={week}
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
  week,
  view,
  moving,
  movingJobId,
  over,
  returnTo,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  column: SchedulerColumn;
  jobs: Record<string, SchedulerJob>;
  week: string;
  view: "week" | "month";
  moving: SchedulerJob | null | undefined;
  movingJobId?: string;
  over: boolean;
  returnTo: string;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (payload: string) => void;
}) {
  const compact = view === "month";
  const outside = compact && column.inMonth === false;
  const visibleIds = compact ? column.jobIds.slice(0, MONTH_JOBS) : column.jobIds;
  const hidden = compact ? Math.max(0, column.jobIds.length - MONTH_JOBS) : 0;
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
      className={`rounded-xl border p-2 ${compact ? "min-h-[9rem]" : "min-h-[16rem]"} ${
        outside ? "opacity-45" : ""
      } ${over || moving ? "border-[#2f7bff] bg-[#0d1f33]" : "border-line bg-paper"}`}
    >
      {compact ? (
        <>
          <p className="text-sm font-semibold text-navy">{Number(column.date.slice(8))}</p>
          <p className="text-[11px] text-muted">{column.hoursLabel}</p>
        </>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{column.label}</p>
          <p className="text-sm font-semibold text-navy">{column.date.slice(5)}</p>
          <p className="mt-1 text-[11px] text-muted">{column.hoursLabel}</p>
        </>
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
      <div className="mt-2 space-y-2">
        {column.jobIds.length === 0 ? (
          <p className="text-[11px] text-muted">{moving ? "Park here" : "Drop a job here"}</p>
        ) : (
          <>
            {visibleIds.map((id) => {
              const job = jobs[id];
              return job ? (
                <SchedulerCard
                  key={id}
                  job={job}
                  booked
                  compact={compact}
                  week={week}
                  view={view}
                  moving={movingJobId === job.id}
                />
              ) : null;
            })}
            {hidden ? (
              <Link
                href={mechanicScheduleHref({ view: "week", week: column.date })}
                className="inline-block text-[11px] font-semibold text-[#7eb0ff]"
              >
                +{hidden} more
              </Link>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function SchedulerCard({
  job,
  booked,
  compact,
  week,
  view,
  moving,
}: {
  job: SchedulerJob;
  booked?: boolean;
  compact?: boolean;
  week: string;
  view: "week" | "month";
  moving?: boolean;
}) {
  const href = mechanicScheduleHref({ view, week, moving: job.id });
  return (
    <div
      draggable
      data-job-id={job.id}
      onDragStart={(event) => {
        activeDrag = { jobId: job.id, time: job.time };
        event.dataTransfer.setData("application/json", JSON.stringify(activeDrag));
        event.dataTransfer.effectAllowed = "move";
      }}
      className={
        booked
          ? `rounded-lg bg-card p-2 hover:bg-[#071422] ${moving ? "ring-2 ring-[#2f7bff]" : ""}`
          : `rounded-xl border border-line bg-paper p-3 hover:bg-card ${moving ? "ring-2 ring-[#2f7bff]" : ""}`
      }
    >
      <Link href={job.href} draggable={false} className="block">
        {booked ? (
          <>
            <p className="text-xs font-bold text-[#7eb0ff]">{job.timeLabel ?? "—"}</p>
            <p className="truncate text-sm font-semibold text-navy">{job.customerName}</p>
            {compact ? null : <p className="truncate text-[11px] text-muted">{job.problem}</p>}
            {compact ? null : (
              <div className="mt-1">
                <JobStatusLabel status={job.status} />
              </div>
            )}
          </>
        ) : (
          <>
            <p className="font-semibold text-navy">{job.customerName}</p>
            <p className="truncate text-sm text-muted">
              {job.vehicleLabel} · {job.problem}
            </p>
          </>
        )}
      </Link>
      <Link href={href} data-move-job={job.id} className="mt-2 inline-block text-[11px] font-semibold text-[#7eb0ff]">
        {moving ? "Picked" : "Move"}
      </Link>
    </div>
  );
}
