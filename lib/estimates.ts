import type { EstimateStatus, JobStatus } from "@prisma/client";

export function estimateHasParts(lineItems: { category: string }[]) {
  return lineItems.some((item) => item.category === "PARTS");
}

/** Parts hold only after an approved estimate — never while waiting on the customer. */
export function jobWaitingOnParts(status: JobStatus, lineItems?: { category: string }[]) {
  if (!lineItems?.length) return false;
  if (status === "AWAITING_APPROVAL" || status === "COMPLETED" || status === "CANCELLED") return false;
  return estimateHasParts(lineItems);
}

export function estimateStatusLabel(status: EstimateStatus, audience: "customer" | "shop" = "customer") {
  switch (status) {
    case "SENT":
      return audience === "shop" ? "Waiting on customer" : "Needs your approval";
    case "APPROVED":
      return "Approved";
    case "DECLINED":
      return "Declined";
    case "SUPERSEDED":
      return "Replaced";
    default:
      return "Draft";
  }
}

export function isSentEstimate(status?: EstimateStatus | null) {
  return status === "SENT";
}

export function estimateStatusClass(status: EstimateStatus) {
  switch (status) {
    case "SENT":
      return "text-[#7b4fd4]";
    case "APPROVED":
      return "text-success";
    case "DECLINED":
      return "text-danger";
    default:
      return "text-muted";
  }
}
