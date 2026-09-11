import type { JobStatus } from "@prisma/client";
import { JOB_STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  REQUESTED: "Request sent",
  ACCEPTED: "Request accepted",
  SCHEDULED: "Appointment scheduled",
  EN_ROUTE: "Mechanic on the way",
  ARRIVED: "Mechanic arrived",
  DIAGNOSING: "Diagnosis complete",
  AWAITING_APPROVAL: "Waiting for your approval",
  IN_PROGRESS: "Repair in progress",
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
            <span className={cn(current ? "font-semibold text-navy" : done ? "text-ink" : "text-muted")}>
              {LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function JobStatusLabel({ status }: { status: JobStatus }) {
  const tone =
    status === "COMPLETED"
      ? "bg-emerald-50 text-success"
      : status === "CANCELLED" || status === "DISPUTED"
        ? "bg-red-50 text-danger"
        : status === "AWAITING_APPROVAL" || status === "REQUESTED"
          ? "bg-[#fff4de] text-warning"
          : "bg-[#e8f1ff] text-[#2f7bff]";
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      {LABELS[status]}
    </span>
  );
}
