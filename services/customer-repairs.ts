import type { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { shopPhotoFor, vehiclePhotoFor } from "@/lib/landing";
import { formatAppointmentDate, formatAppointmentTime } from "@/lib/datetime";
import { formatBoardDate, formatRelative } from "@/lib/utils";

export type RepairTab =
  | "all"
  | "in-progress"
  | "waiting-parts"
  | "waiting-approval"
  | "completed"
  | "cancelled";

export type RepairBadgeTone = "info" | "warning" | "success" | "muted";

export type RepairAction = {
  href: string;
  label: string;
  variant: "link" | "primary" | "secondary";
};

export type RepairRow = {
  id: string;
  tab: RepairTab;
  vehicleLabel: string;
  problem: string;
  shopName: string;
  shopCity: string;
  shopPhoto: string;
  photo: string;
  badge: { label: string; tone: RepairBadgeTone };
  dateLabel: string;
  dateValue: string;
  relativeLabel: string | null;
  steps: string[];
  stepIndex: number;
  priceLabel: string;
  price: string;
  actions: RepairAction[];
};

export type UpcomingAppointment = {
  id: string;
  vehicleLabel: string;
  shopName: string;
  photo: string;
  dateLabel: string;
  timeLabel: string;
  calendarHref: string;
  detailsHref: string;
};

export type RepairHistorySummary = {
  total: number;
  completed: number;
  inProgress: number;
  spentLabel: string;
};

type JobRow = {
  id: string;
  status: JobStatus;
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  scheduledAt: Date | null;
  review: { id: string } | null;
  thread: { id: string } | null;
  mechanicProfile: { businessName: string; shopCity: string | null; shopState: string | null; slug: string };
  vehicle: { year: number; make: { name: string }; model: { name: string } };
  serviceRequest: { problemText: string };
  estimates: { totalCents: number }[];
};

const defaultSteps = ["Received", "Diagnosing", "Parts Ordered", "In Service", "Complete"];
const approvalSteps = ["Received", "Diagnosing", "Waiting Approval", "In Service", "Complete"];

export async function getCustomerRepairs(userId: string) {
  const jobs = await prisma.job.findMany({
    where: { customerId: userId },
    include: {
      mechanicProfile: true,
      vehicle: { include: { make: true, model: true } },
      serviceRequest: true,
      estimates: { orderBy: { createdAt: "desc" }, take: 1 },
      review: true,
      thread: true,
    },
  });

  const rows = jobs
    .map((job) => toRow(job))
    .sort((a, b) => {
      const jobA = jobs.find((job) => job.id === a.id)!;
      const jobB = jobs.find((job) => job.id === b.id)!;
      return compareJobs(jobA, jobB);
    });

  const counts: Record<RepairTab, number> = {
    all: rows.length,
    "in-progress": rows.filter((row) => row.tab === "in-progress").length,
    "waiting-parts": rows.filter((row) => row.tab === "waiting-parts").length,
    "waiting-approval": rows.filter((row) => row.tab === "waiting-approval").length,
    completed: rows.filter((row) => row.tab === "completed").length,
    cancelled: rows.filter((row) => row.tab === "cancelled").length,
  };

  const now = Date.now();
  const next = [...jobs]
    .filter((job) => job.scheduledAt && job.scheduledAt.getTime() >= now && job.status !== "CANCELLED" && job.status !== "COMPLETED")
    .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime())[0];

  const appointment: UpcomingAppointment | null = next
    ? {
        id: next.id,
        vehicleLabel: `${next.vehicle.year} ${next.vehicle.make.name} ${next.vehicle.model.name}`,
        shopName: next.mechanicProfile.businessName,
        photo: vehiclePhotoFor(next.vehicle.make.name, next.vehicle.model.name),
        dateLabel: formatAppointmentDate(next.scheduledAt!),
        timeLabel: formatAppointmentTime(next.scheduledAt!),
        calendarHref: `/jobs/${next.id}/calendar`,
        detailsHref: `/jobs/${next.id}#appointment`,
      }
    : null;

  const history: RepairHistorySummary = {
    total: rows.length,
    completed: counts.completed,
    inProgress: counts["in-progress"] + counts["waiting-approval"] + counts["waiting-parts"],
    spentLabel: formatPrice(
      jobs.filter((job) => job.status === "COMPLETED").reduce((sum, job) => sum + job.totalCents, 0),
      true,
    ),
  };

  return { rows, counts, appointment, history };
}

function compareJobs(a: JobRow, b: JobRow) {
  const rank = (job: JobRow) => {
    if (job.status === "CANCELLED") return 4;
    if (job.status === "COMPLETED") return 3;
    if (job.scheduledAt && job.scheduledAt.getTime() >= Date.now()) return 0;
    if (job.status === "AWAITING_APPROVAL") return 1;
    return 2;
  };
  const byRank = rank(a) - rank(b);
  if (byRank !== 0) return byRank;
  if (a.scheduledAt && b.scheduledAt && rank(a) === 0) {
    return a.scheduledAt.getTime() - b.scheduledAt.getTime();
  }
  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

function toRow(job: JobRow): RepairRow {
  const vehicleLabel = `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`;
  const shopCity = [job.mechanicProfile.shopCity, job.mechanicProfile.shopState].filter(Boolean).join(", ");
  const amount = job.estimates[0]?.totalCents ?? job.totalCents;
  const presentation = livePresentation(job, amount);

  return {
    id: job.id,
    tab: presentation.tab,
    vehicleLabel,
    problem: job.serviceRequest.problemText,
    shopName: job.mechanicProfile.businessName,
    shopCity,
    shopPhoto: shopPhotoFor(job.mechanicProfile.slug),
    photo: vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name),
    badge: presentation.badge,
    dateLabel: presentation.dateLabel,
    dateValue: presentation.dateValue,
    relativeLabel: presentation.relativeLabel,
    steps: presentation.steps,
    stepIndex: presentation.stepIndex,
    priceLabel: presentation.priceLabel,
    price: presentation.price,
    actions: presentation.actions,
  };
}

function livePresentation(job: JobRow, amount: number) {
  const details = `/jobs/${job.id}`;
  const messageHref = job.thread?.id ? details : "/messages";
  const hasReview = Boolean(job.review);
  const stamp = job.completedAt ?? job.updatedAt ?? job.createdAt;
  const relative = formatRelative(job.updatedAt);
  const dateValue = job.scheduledAt ? formatBoardDate(job.scheduledAt) : formatBoardDate(stamp);
  const scheduleAction: RepairAction = job.scheduledAt
    ? { href: `${details}#appointment`, label: "Reschedule", variant: "secondary" }
    : { href: `${details}#appointment`, label: "Set time", variant: "secondary" };

  if (job.status === "COMPLETED") {
    return {
      tab: "completed" as const,
      badge: { label: "Completed", tone: "success" as const },
      dateLabel: "Completed",
      dateValue: formatBoardDate(job.completedAt ?? stamp),
      relativeLabel: relative,
      steps: defaultSteps,
      stepIndex: 4,
      priceLabel: "Total",
      price: formatPrice(amount, true),
      actions: completedActions(details, hasReview),
    };
  }
  if (job.status === "CANCELLED") {
    return {
      tab: "cancelled" as const,
      badge: { label: "Cancelled", tone: "muted" as const },
      dateLabel: "Cancelled",
      dateValue,
      relativeLabel: relative,
      steps: defaultSteps,
      stepIndex: 0,
      priceLabel: "Total",
      price: formatPrice(amount, true),
      actions: [{ href: details, label: "View Details", variant: "link" as const }],
    };
  }
  if (job.status === "AWAITING_APPROVAL") {
    return {
      tab: "waiting-approval" as const,
      badge: { label: "Waiting on Approval", tone: "warning" as const },
      dateLabel: job.scheduledAt ? "Appointment" : "Estimate Received",
      dateValue,
      relativeLabel: relative,
      steps: approvalSteps,
      stepIndex: 2,
      priceLabel: "Estimate",
      price: formatPrice(amount, true),
      actions: [
        { href: details, label: "View Estimate", variant: "primary" as const },
        scheduleAction,
        { href: messageHref, label: "Message Shop", variant: "secondary" as const },
      ],
    };
  }
  if (job.status === "DISPUTED") {
    return {
      tab: "in-progress" as const,
      badge: { label: "Disputed", tone: "warning" as const },
      dateLabel: "Opened",
      dateValue,
      relativeLabel: relative,
      steps: defaultSteps,
      stepIndex: 3,
      priceLabel: amount ? "Total" : "Estimate",
      price: amount ? formatPrice(amount, true) : "Pending",
      actions: [{ href: details, label: "View Details", variant: "primary" as const }],
    };
  }

  const badge = badgeForActive(job.status, Boolean(job.scheduledAt));
  return {
    tab: "in-progress" as const,
    badge,
    dateLabel: job.scheduledAt ? "Appointment" : dateLabelFor(job.status),
    dateValue,
    relativeLabel: relative,
    steps: defaultSteps,
    stepIndex: stepIndexFor(job.status),
    priceLabel: amount ? "Estimated Total" : "Estimate",
    price: amount ? formatPrice(amount, true) : "Pending",
    actions: [
      { href: details, label: "View Details", variant: "primary" as const },
      scheduleAction,
      { href: messageHref, label: "Message Shop", variant: "secondary" as const },
    ],
  };
}

function badgeForActive(status: JobStatus, scheduled: boolean): { label: string; tone: RepairBadgeTone } {
  if (status === "REQUESTED") return { label: "Request sent", tone: "muted" };
  if (status === "ACCEPTED") return { label: scheduled ? "Scheduled" : "Accepted", tone: "success" };
  if (status === "SCHEDULED") return { label: "Scheduled", tone: "success" };
  if (status === "DIAGNOSING") return { label: "Diagnosing", tone: "info" };
  if (status === "EN_ROUTE" || status === "ARRIVED") return { label: "In Service", tone: "info" };
  return { label: "In Progress", tone: "info" };
}

function dateLabelFor(status: JobStatus) {
  if (status === "REQUESTED") return "Requested";
  if (status === "ACCEPTED") return "Accepted";
  return "Started";
}

function stepIndexFor(status: JobStatus) {
  if (status === "IN_PROGRESS") return 3;
  if (status === "DIAGNOSING" || status === "EN_ROUTE" || status === "ARRIVED") return 1;
  if (status === "SCHEDULED" || status === "ACCEPTED") return 1;
  return 0;
}

function completedActions(details: string, hasReview: boolean): RepairAction[] {
  const actions: RepairAction[] = [{ href: details, label: "View Invoice", variant: "primary" }];
  if (!hasReview) actions.push({ href: details, label: "Leave a Review", variant: "secondary" });
  return actions;
}

function formatPrice(cents: number, withCents: boolean) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  });
}
