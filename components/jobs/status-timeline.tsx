import type { JobStatus } from "@prisma/client";
import { JOB_STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type StatusAudience = "customer" | "shop";

function labelFor(status: string, audience: StatusAudience) {
  switch (status) {
    case "REQUESTED":
      return audience === "shop" ? "New request" : "Request sent";
    case "ACCEPTED":
      return "Accepted";
    case "SCHEDULED":
      return "Appointment scheduled";
    case "EN_ROUTE":
      return audience === "shop" ? "En route" : "Mechanic on the way";
    case "ARRIVED":
      return audience === "shop" ? "On site" : "Mechanic arrived";
    case "DIAGNOSING":
      return "Diagnosing";
    case "AWAITING_APPROVAL":
      return audience === "shop" ? "Waiting on the customer" : "Waiting for your approval";
    case "IN_PROGRESS":
      return "Repair in progress";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "DISPUTED":
      return "In dispute";
    default:
      return status.replaceAll("_", " ").toLowerCase();
  }
}

export function jobStatusLabel(status: JobStatus, audience: StatusAudience = "customer") {
  return labelFor(status, audience);
}

export function StatusTimeline({
  status,
  audience = "customer",
  estimateApproved = false,
}: {
  status: JobStatus;
  audience?: StatusAudience;
  estimateApproved?: boolean;
}) {
  if (status === "CANCELLED" || status === "DISPUTED") {
    return <p className="text-sm font-medium text-danger">{labelFor(status, audience)}</p>;
  }
  const currentIndex = JOB_STATUS_ORDER.indexOf(status as (typeof JOB_STATUS_ORDER)[number]);
  const waiting = status === "AWAITING_APPROVAL";
  return (
    <ol className="space-y-2">
      {JOB_STATUS_ORDER.map((step, index) => {
        const current = step === status;
        const done =
          !current &&
          (status === "COMPLETED" ||
            index < currentIndex ||
            (step === "AWAITING_APPROVAL" && estimateApproved && !waiting));
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
              {labelFor(step, audience)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function JobStatusLabel({
  status,
  audience = "customer",
}: {
  status: JobStatus;
  audience?: StatusAudience;
}) {
  const tone =
    status === "COMPLETED"
      ? "bg-emerald-50 text-success"
      : status === "CANCELLED" || status === "DISPUTED"
        ? "bg-red-50 text-danger"
        : status === "AWAITING_APPROVAL"
          ? "bg-[#f3e8ff] text-[#7b4fd4]"
          : status === "REQUESTED"
            ? "bg-[#fff4de] text-warning"
            : "bg-[#e8f1ff] text-[#2f7bff]";
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      {labelFor(status, audience)}
    </span>
  );
}
