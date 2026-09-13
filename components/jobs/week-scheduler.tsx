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

export function WeekScheduler({
  jobs,
  columns,
  unscheduled,
}: {
  jobs: Record<string, SchedulerJob>;
  columns: SchedulerColumn[];
  unscheduled: SchedulerJob[];
}) {
  const [overDate, setOverDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function dropOnDate(date: string, payload: string) {
    if (!payload) return;
    let data: { jobId: string; time?: string };
    try {
      data = JSON.parse(payload) as { jobId: string; time?: string };
    } catch {
      return;
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
    }
  }

  return (
    <div className={busy ? "pointer-events-none opacity-70" : undefined}>
      {unscheduled.length ? (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold text-navy">Needs a time</h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unscheduled.map((job) => (
              <SchedulerCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-2 md:grid-cols-7">
        {columns.map((column) => (
          <section
            key={column.date}
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
            className={`min-h-[16rem] rounded-xl border p-2 ${overDate === column.date ? "border-[#2f7bff] bg-[#0d1f33]" : "border-line bg-paper"}`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{column.label}</p>
            <p className="text-sm font-semibold text-navy">{column.date.slice(5)}</p>
            <p className="mt-1 text-[11px] text-muted">{column.hoursLabel}</p>
            <div className="mt-2 space-y-2">
              {column.jobIds.length === 0 ? (
                <p className="text-[11px] text-muted">Drop a job here</p>
              ) : (
                column.jobIds.map((id) => {
                  const job = jobs[id];
                  return job ? <SchedulerCard key={id} job={job} booked /> : null;
                })
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SchedulerCard({ job, booked }: { job: SchedulerJob; booked?: boolean }) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/json", JSON.stringify({ jobId: job.id, time: job.time }));
        event.dataTransfer.effectAllowed = "move";
      }}
      className={booked ? "rounded-lg bg-card p-2 hover:bg-[#071422]" : "rounded-xl border border-line bg-paper p-3 hover:bg-card"}
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
    </div>
  );
}
