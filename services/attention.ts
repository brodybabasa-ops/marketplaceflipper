import { prisma } from "@/lib/db";
import { marketplaceCoverage } from "@/services/hq";
import { isVisionDemoEnabled } from "@/lib/vision";
import { visionFixtures } from "@/lib/vision-fixtures";

export async function providerAttention(mechanicProfileId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);

  const [requests, today, awaiting, staleEstimates, parts, ready, unpaid, recommended, warranties, waiting, outcomes, dueFollowUps] = await Promise.all([
    prisma.job.count({ where: { mechanicProfileId, status: "REQUESTED" } }),
    prisma.job.findMany({
      where: { mechanicProfileId, scheduledAt: { gte: startOfDay }, status: { notIn: ["CANCELLED", "COMPLETED"] } },
      include: { customer: true, asset: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
      orderBy: { scheduledAt: "asc" },
      take: 12,
    }),
    prisma.job.count({ where: { mechanicProfileId, status: "AWAITING_APPROVAL" } }),
    prisma.estimate.count({
      where: { job: { mechanicProfileId }, status: "SENT", sentAt: { lte: dayAgo } },
    }),
    prisma.job.count({ where: { mechanicProfileId, partsStatus: { in: ["ORDERED", "ARRIVING", "DELAYED"] }, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.job.count({ where: { mechanicProfileId, status: "READY" } }),
    prisma.job.count({ where: { mechanicProfileId, status: "COMPLETED", paymentStatus: { not: "PAID" } } }),
    prisma.recommendedWork.findMany({
      where: { mechanicProfileId, status: "OPEN" },
      include: { customer: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.repairWarranty.count({
      where: { mechanicProfileId, expiresAt: { lte: new Date(Date.now() + 30 * 86400000), gte: new Date() } },
    }),
    prisma.job.count({
      where: { mechanicProfileId, customerWaiting: true, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    prisma.job.count({
      where: { mechanicProfileId, status: "COMPLETED", outcome: { is: null } },
    }),
    prisma.recommendedWork.count({
      where: { mechanicProfileId, status: "OPEN", followUpDate: { lte: new Date() } },
    }),
  ]);

  const items = [
    requests ? { href: "/mechanic/requests", label: `${requests} new request${requests === 1 ? "" : "s"}`, tone: "accent" as const } : null,
    waiting ? { href: "/mechanic/jobs", label: `${waiting} customer${waiting === 1 ? "" : "s"} waiting`, tone: "warning" as const } : null,
    awaiting ? { href: "/mechanic/estimates", label: `${awaiting} estimate${awaiting === 1 ? "" : "s"} waiting on the customer`, tone: "warning" as const } : null,
    staleEstimates ? { href: "/mechanic/estimates", label: `${staleEstimates} estimate${staleEstimates === 1 ? "" : "s"} waiting more than 24 hours`, tone: "warning" as const } : null,
    parts ? { href: "/mechanic/board", label: `${parts} job${parts === 1 ? "" : "s"} waiting on parts`, tone: "warning" as const } : null,
    ready ? { href: "/mechanic/board", label: `${ready} ready for pickup`, tone: "success" as const } : null,
    unpaid ? { href: "/mechanic/earnings", label: `${unpaid} payment${unpaid === 1 ? "" : "s"} outstanding`, tone: "danger" as const } : null,
    dueFollowUps ? { href: "/mechanic/customers/today", label: `${dueFollowUps} follow-up${dueFollowUps === 1 ? "" : "s"} due`, tone: "accent" as const } : null,
    recommended.length ? { href: "/mechanic/customers/today", label: `${recommended.length} recommended-work follow-up${recommended.length === 1 ? "" : "s"}`, tone: "accent" as const } : null,
    outcomes ? { href: "/mechanic/customers", label: `${outcomes} completed repair${outcomes === 1 ? "" : "s"} waiting on an outcome`, tone: "muted" as const } : null,
    warranties ? { href: "/mechanic/customers", label: `${warranties} warranty follow-up${warranties === 1 ? "" : "s"} this month`, tone: "muted" as const } : null,
  ].filter(Boolean);

  return { items, today, recommended, requests, awaiting, ready };
}

export async function hqAttentionCenter() {
  const [disputes, failed, applications, unmatched, stuck, flagged, coverage] = await Promise.all([
    prisma.dispute.findMany({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } }, orderBy: { createdAt: "asc" }, take: 8 }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.verificationApplication.count({ where: { status: { in: ["APPLICATION_RECEIVED", "REVIEWING", "VISIT_SCHEDULING"] } } }),
    prisma.serviceRequest.count({ where: { status: "OPEN" } }),
    prisma.job.count({
      where: { status: { in: ["AWAITING_APPROVAL", "DIAGNOSING", "IN_PROGRESS"] }, updatedAt: { lte: new Date(Date.now() - 48 * 3600 * 1000) } },
    }),
    prisma.review.count({ where: { flagged: true, hidden: false } }),
    marketplaceCoverage(),
  ]);

  const shortages = coverage.filter((item) => item.coverage.includes("low") || item.coverage.includes("High demand"));
  const stored = await prisma.hqAlert.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 12 });
  const computed = [
    disputes.length ? { href: "/admin/disputes", title: `${disputes.length} open Assurance claim${disputes.length === 1 ? "" : "s"}`, severity: "danger", kind: "ASSURANCE" } : null,
    failed ? { href: "/admin/payments", title: `${failed} failed payment${failed === 1 ? "" : "s"}`, severity: "warning", kind: "FAILED_PAYMENT" } : null,
    applications ? { href: "/admin/verification", title: `${applications} verification application${applications === 1 ? "" : "s"} waiting`, severity: "accent", kind: "VERIFICATION" } : null,
    unmatched ? { href: "/admin/marketplace", title: `${unmatched} unmatched request${unmatched === 1 ? "" : "s"}`, severity: "warning", kind: "UNMATCHED_REQUEST" } : null,
    stuck ? { href: "/admin/jobs", title: `${stuck} job${stuck === 1 ? "" : "s"} stuck more than 48 hours`, severity: "warning", kind: "STUCK_JOB" } : null,
    flagged ? { href: "/admin/reviews", title: `${flagged} flagged review${flagged === 1 ? "" : "s"}`, severity: "warning", kind: "COMPLAINT" } : null,
    ...shortages.map((item) => ({
      href: "/admin/marketplace",
      title: `${item.name}: ${item.coverage}`,
      severity: "accent",
      kind: "SHORTAGE",
    })),
  ].filter(Boolean);

  const fixtures = isVisionDemoEnabled()
    ? (visionFixtures()?.providersNeeded ?? []).map((item) => ({
        href: "/admin/recruiting",
        title: `Providers needed: ${item.need} in ${item.market}`,
        severity: "accent",
        kind: "SHORTAGE",
        fixture: true,
      }))
    : [];

  return { computed: [...computed, ...fixtures], stored, coverage, disputes };
}

export async function marketplaceHealth() {
  const coverage = await marketplaceCoverage();
  const byCategory = await prisma.serviceRequest.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  const fixtures = isVisionDemoEnabled() ? visionFixtures() : null;
  return { coverage, byCategory, fixtures };
}
