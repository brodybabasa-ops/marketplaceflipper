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

export function StatusTimeline({ status }: { status: JobStatus }) {
  if (status === "CANCELLED" || status === "DISPUTED") {
    return <p className="text-sm font-medium text-danger">{LABELS[status]}</p>;
  }
  const currentIndex = JOB_STATUS_ORDER.indexOf(status as (typeof JOB_STATUS_ORDER)[number]);
  return (
    <ol className="space-y-2">
      {JOB_STATUS_ORDER.map((step, index) => {
        const done = index < currentIndex || status === "COMPLETED";
        const current = step === status;
        return (
          <li key={step} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                done ? "bg-success text-white" : current ? "bg-accent text-white" : "border border-line text-muted",
              )}
            >
              {done ? "✓" : current ? "→" : "○"}
            </span>
            <span className={cn(current ? "font-semibold text-ink" : done ? "text-ink" : "text-muted")}>
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
