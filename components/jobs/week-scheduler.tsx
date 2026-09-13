"use client";

import Link from "next/link";
import { useState } from "react";
import { JobStatusLabel } from "@/components/jobs/status-timeline";
import { scheduleAppointmentAction } from "@/app/actions/marketplace";
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
};

let activeDrag: { jobId: string; time: string } | null = null;

export function WeekScheduler({
  jobs,
  columns,
  unscheduled,
  week,
  movingJobId,
}: {
  jobs: Record<string, SchedulerJob>;
  columns: SchedulerColumn[];
  unscheduled: SchedulerJob[];
  week: string;
  movingJobId?: string;
}) {
  const [overDate, setOverDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const moving = movingJobId ? jobs[movingJobId] : null;

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
    <div className={busy ? "pointer-events-none opacity-70" : undefined}>
      {unscheduled.length ? (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold text-navy">Needs a time</h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unscheduled.map((job) => (
              <SchedulerCard key={job.id} job={job} week={week} moving={movingJobId === job.id} />
            ))}
          </div>
        </section>
      ) : null}

      {moving ? (
        <p className="mb-3 text-sm text-[#7eb0ff]">
          Moving {moving.customerName}. Drag onto a day or use Park here.
        </p>
      ) : null}

      <div className="grid gap-2 md:grid-cols-7">
        {columns.map((column) => (
          <section
            key={column.date}
            data-date={column.date}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOverDate(column.date);
            }}
            onDragLeave={() => setOverDate((current) => (current === column.date ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              const payload = event.dataTransfer.getData("application/json");
              void dropOnDate(column.date, payload);
            }}
            className={`min-h-[16rem] rounded-xl border p-2 ${overDate === column.date || moving ? "border-[#2f7bff] bg-[#0d1f33]" : "border-line bg-paper"}`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{column.label}</p>
            <p className="text-sm font-semibold text-navy">{column.date.slice(5)}</p>
            <p className="mt-1 text-[11px] text-muted">{column.hoursLabel}</p>
            {moving ? (
              <form action={scheduleAppointmentAction} className="mt-2">
                <input type="hidden" name="jobId" value={moving.id} />
                <input type="hidden" name="date" value={column.date} />
                <input type="hidden" name="time" value={moving.time} />
                <button
                  type="submit"
                  name="parkJob"
                  className="text-[11px] font-semibold text-[#7eb0ff]"
                >
                  Park here
                </button>
              </form>
            ) : null}
            <div className="mt-2 space-y-2">
              {column.jobIds.length === 0 ? (
                <p className="text-[11px] text-muted">{moving ? "Park here" : "Drop a job here"}</p>
              ) : (
                column.jobIds.map((id) => {
                  const job = jobs[id];
                  return job ? <SchedulerCard key={id} job={job} booked week={week} moving={movingJobId === job.id} /> : null;
                })
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SchedulerCard({
  job,
  booked,
  week,
  moving,
}: {
  job: SchedulerJob;
  booked?: boolean;
  week: string;
  moving?: boolean;
}) {
  const href = `/mechanic/schedule?week=${week}&moving=${job.id}`;
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
            <p className="truncate text-[11px] text-muted">{job.problem}</p>
            <div className="mt-1">
              <JobStatusLabel status={job.status} />
            </div>
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
