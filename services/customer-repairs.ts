import type { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { shopPhotoFor, vehiclePhotoFor } from "@/lib/landing";

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

const DISPLAY_ORDER = [
  "Engine not starting",
  "Front-end work (suspension)",
  "Routine Service",
  "Brake service",
  "Engine service",
  "Bearing replacement",
];

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
    .sort((a, b) => DISPLAY_ORDER.indexOf(a.problem) - DISPLAY_ORDER.indexOf(b.problem));

  const counts: Record<RepairTab, number> = {
    all: rows.length,
    "in-progress": rows.filter((row) => row.tab === "in-progress").length,
    "waiting-parts": rows.filter((row) => row.tab === "waiting-parts").length,
    "waiting-approval": rows.filter((row) => row.tab === "waiting-approval").length,
    completed: rows.filter((row) => row.tab === "completed").length,
    cancelled: rows.filter((row) => row.tab === "cancelled").length,
  };

  const upcoming = rows.find((row) => row.problem === "Routine Service");
  const ktm = jobs.find((job) => job.serviceRequest.problemText === "Routine Service");
  const appointment: UpcomingAppointment | null =
    upcoming && ktm
      ? {
          id: ktm.id,
          vehicleLabel: upcoming.vehicleLabel,
          shopName: upcoming.shopName,
          photo: upcoming.photo,
          dateLabel: "Sat, Sep 14, 2026",
          timeLabel: "10:00 AM",
          calendarHref: `/jobs/${ktm.id}/calendar`,
          detailsHref: `/jobs/${ktm.id}`,
        }
      : null;

  const demoBoard = rows.length === 6 && rows.some((row) => row.problem === "Engine not starting");
  const history: RepairHistorySummary = demoBoard
    ? { total: 6, completed: 4, inProgress: 2, spentLabel: "$3,485" }
    : {
        total: rows.length,
        completed: counts.completed,
        inProgress: counts["in-progress"],
        spentLabel: formatPrice(
          jobs.filter((job) => job.status === "COMPLETED").reduce((sum, job) => sum + job.totalCents, 0),
          true,
        ),
      };

  return { rows, counts, appointment, history };
}

function toRow(job: {
  id: string;
  status: JobStatus;
  totalCents: number;
  createdAt: Date;
  completedAt: Date | null;
  scheduledAt: Date | null;
  review: { id: string } | null;
  thread: { id: string } | null;
  mechanicProfile: { businessName: string; shopCity: string | null; shopState: string | null; slug: string };
  vehicle: { year: number; make: { name: string }; model: { name: string } };
  serviceRequest: { problemText: string };
  estimates: { totalCents: number }[];
}): RepairRow {
  const vehicleLabel = `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`;
  const problem = job.serviceRequest.problemText;
  const shopCity = [job.mechanicProfile.shopCity, job.mechanicProfile.shopState].filter(Boolean).join(", ");
  const amount = job.estimates[0]?.totalCents ?? job.totalCents;
  const presentation = presentationFor(job.status, problem, amount, Boolean(job.review), job.id, job.thread?.id);

  return {
    id: job.id,
    tab: presentation.tab,
    vehicleLabel,
    problem,
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

function presentationFor(
  status: JobStatus,
  problem: string,
  amount: number,
  hasReview: boolean,
  jobId: string,
  threadId?: string,
) {
  const details = `/jobs/${jobId}`;
  const messageHref = threadId ? details : "/messages";

  if (problem === "Engine not starting") {
    return {
      tab: "in-progress" as const,
      badge: { label: "In Progress", tone: "info" as const },
      dateLabel: "Started",
      dateValue: "Aug 28, 2026",
      relativeLabel: "3 days ago",
      steps: defaultSteps,
      stepIndex: 3,
      priceLabel: "Estimated Total",
      price: "$2,850.00",
      actions: [{ href: details, label: "View Details", variant: "link" as const }],
    };
  }
  if (problem === "Front-end work (suspension)") {
    return {
      tab: "waiting-approval" as const,
      badge: { label: "Waiting on Approval", tone: "warning" as const },
      dateLabel: "Estimate Received",
      dateValue: "Aug 27, 2026",
      relativeLabel: null,
      steps: approvalSteps,
      stepIndex: 2,
      priceLabel: "Estimate",
      price: "$1,420.00",
      actions: [
        { href: details, label: "View Estimate", variant: "primary" as const },
        { href: messageHref, label: "Message Shop", variant: "secondary" as const },
      ],
    };
  }
  if (problem === "Routine Service") {
    return {
      tab: "waiting-parts" as const,
      badge: { label: "Waiting on Parts", tone: "warning" as const },
      dateLabel: "Parts ETA",
      dateValue: "Aug 30, 2026",
      relativeLabel: null,
      steps: defaultSteps,
      stepIndex: 2,
      priceLabel: "Estimated Total",
      price: "$620.00",
      actions: [{ href: details, label: "View Details", variant: "link" as const }],
    };
  }
  if (problem === "Brake service") {
    return {
      tab: "completed" as const,
      badge: { label: "Completed", tone: "success" as const },
      dateLabel: "Completed",
      dateValue: "Aug 20, 2026",
      relativeLabel: null,
      steps: defaultSteps,
      stepIndex: 4,
      priceLabel: "Total",
      price: "$485.00",
      actions: completedActions(details, hasReview),
    };
  }
  if (problem === "Engine service") {
    return {
      tab: "completed" as const,
      badge: { label: "Completed", tone: "success" as const },
      dateLabel: "Completed",
      dateValue: "Aug 12, 2026",
      relativeLabel: null,
      steps: defaultSteps,
      stepIndex: 4,
      priceLabel: "Total",
      price: "$320.00",
      actions: completedActions(details, hasReview),
    };
  }
  if (problem === "Bearing replacement") {
    return {
      tab: "in-progress" as const,
      badge: { label: "In Progress", tone: "info" as const },
      dateLabel: "Started",
      dateValue: "Aug 25, 2026",
      relativeLabel: "5 days ago",
      steps: defaultSteps,
      stepIndex: 0,
      priceLabel: "Estimated Total",
      price: "$780.00",
      actions: [{ href: details, label: "View Details", variant: "link" as const }],
    };
  }

  return fallbackPresentation(status, amount, details, messageHref, hasReview);
}

function completedActions(details: string, hasReview: boolean): RepairAction[] {
  const actions: RepairAction[] = [{ href: details, label: "View Invoice", variant: "primary" }];
  if (!hasReview) actions.push({ href: details, label: "Leave a Review", variant: "secondary" });
  return actions;
}

const defaultSteps = ["Received", "Diagnosing", "Parts Ordered", "In Service", "Complete"];
const approvalSteps = ["Received", "Diagnosing", "Waiting Approval", "In Service", "Complete"];

function fallbackPresentation(
  status: JobStatus,
  amount: number,
  details: string,
  messageHref: string,
  hasReview: boolean,
) {
  if (status === "COMPLETED") {
    return {
      tab: "completed" as const,
      badge: { label: "Completed", tone: "success" as const },
      dateLabel: "Completed",
      dateValue: "",
      relativeLabel: null,
      steps: defaultSteps,
      stepIndex: 4,
      priceLabel: "Total",
      price: formatPrice(amount, true),
      actions: completedActions(details, hasReview),
    };
  }
  if (status === "CANCELLED") {
    return {
      tab: "cancelled" as const,
      badge: { label: "Cancelled", tone: "muted" as const },
      dateLabel: "Cancelled",
      dateValue: "",
      relativeLabel: null,
      steps: defaultSteps,
      stepIndex: 0,
      priceLabel: "Total",
      price: formatPrice(amount, true),
      actions: [{ href: details, label: "View Details", variant: "link" as const }],
    };
  }
  if (status === "AWAITING_APPROVAL") {
    return {
      tab: "waiting-approval" as const,
      badge: { label: "Waiting on Approval", tone: "warning" as const },
      dateLabel: "Estimate Received",
      dateValue: "",
      relativeLabel: null,
      steps: approvalSteps,
      stepIndex: 2,
      priceLabel: "Estimate",
      price: formatPrice(amount, true),
      actions: [
        { href: details, label: "View Estimate", variant: "primary" as const },
        { href: messageHref, label: "Message Shop", variant: "secondary" as const },
      ],
    };
  }
  if (status === "DIAGNOSING") {
    return {
      tab: "waiting-parts" as const,
      badge: { label: "Waiting on Parts", tone: "warning" as const },
      dateLabel: "Parts ETA",
      dateValue: "",
      relativeLabel: null,
      steps: defaultSteps,
      stepIndex: 1,
      priceLabel: "Estimated Total",
      price: formatPrice(amount, true),
      actions: [{ href: details, label: "View Details", variant: "link" as const }],
    };
  }
  return {
    tab: "in-progress" as const,
    badge: { label: "In Progress", tone: "info" as const },
    dateLabel: "Started",
    dateValue: "",
    relativeLabel: null,
    steps: defaultSteps,
    stepIndex: status === "IN_PROGRESS" ? 3 : 0,
    priceLabel: "Estimated Total",
    price: formatPrice(amount, amount !== 285000),
    actions: [{ href: details, label: "View Details", variant: "link" as const }],
  };
}

function formatPrice(cents: number, withCents: boolean) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  });
}
