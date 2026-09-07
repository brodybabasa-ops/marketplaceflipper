import type { JobStatus } from "@prisma/client";
import { JOB_STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  REQUESTED: "Request sent",
  ACCEPTED: "Request accepted",
  SCHEDULED: "Appointment scheduled",
  EN_ROUTE: "Mechanic on the way",
  ARRIVED: "Mechanic arrived",
  CHECKED_IN: "Checked in",
  DIAGNOSING: "Diagnosing",
  AWAITING_APPROVAL: "Waiting for your approval",
  IN_PROGRESS: "Repairing",
  QUALITY_CHECK: "Quality check",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "In dispute",
};

export function jobProgressPercent(status: JobStatus) {
  const map: Partial<Record<JobStatus, number>> = {
    REQUESTED: 8,
    ACCEPTED: 18,
    SCHEDULED: 28,
    EN_ROUTE: 36,
    ARRIVED: 42,
    CHECKED_IN: 48,
    DIAGNOSING: 56,
    AWAITING_APPROVAL: 64,
    IN_PROGRESS: 78,
    QUALITY_CHECK: 88,
    READY: 96,
    COMPLETED: 100,
  };
  return map[status] ?? 0;
}

export function StatusTimeline({ status }: { status: JobStatus }) {
  if (status === "CANCELLED" || status === "DISPUTED") {
    return <p className="text-sm font-medium text-danger">{LABELS[status]}</p>;
  }
  const currentIndex = JOB_STATUS_ORDER.indexOf(status as (typeof JOB_STATUS_ORDER)[number]);
  const compact = ["REQUESTED", "ACCEPTED", "SCHEDULED", "DIAGNOSING", "AWAITING_APPROVAL", "IN_PROGRESS", "READY", "COMPLETED"] as const;
  const steps = compact.filter((step) => JOB_STATUS_ORDER.includes(step));
  return (
    <ol className="space-y-3">
      {steps.map((step) => {
        const index = JOB_STATUS_ORDER.indexOf(step);
        const done = index < currentIndex || status === "COMPLETED";
        const current = step === status || (step === "IN_PROGRESS" && ["EN_ROUTE", "ARRIVED", "CHECKED_IN", "QUALITY_CHECK"].includes(status));
        return (
          <li key={step} className="flex items-start gap-3 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                done ? "bg-success text-white" : current ? "bg-accent text-white" : "border border-line text-muted",
              )}
            >
              {done ? "✓" : current ? "→" : ""}
            </span>
            <span className={cn("pt-0.5", current ? "font-semibold text-ink" : done ? "text-ink" : "text-muted")}>
              {LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function JobStatusLabel({ status }: { status: JobStatus }) {
  return <span className="text-sm font-medium text-ink">{LABELS[status]}</span>;
}
