import { prisma } from "@/lib/db";

export async function hqSearch(q: string) {
  const term = q.trim();
  if (!term) return { customers: [], providers: [], jobs: [], vehicles: [] };
  const [customers, providers, jobs, vehicles] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: [
          { email: { contains: term, mode: "insensitive" } },
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { phone: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 8,
    }),
    prisma.mechanicProfile.findMany({
      where: {
        OR: [
          { businessName: { contains: term, mode: "insensitive" } },
          { slug: { contains: term, mode: "insensitive" } },
          { user: { email: { contains: term, mode: "insensitive" } } },
        ],
      },
      include: { user: true },
      take: 8,
    }),
    prisma.job.findMany({
      where: {
        OR: [{ id: { equals: term } }, { serviceRequest: { problemText: { contains: term, mode: "insensitive" } } }],
      },
      include: { customer: true, mechanicProfile: true, serviceRequest: true },
      take: 8,
    }),
    prisma.vehicle.findMany({
      where: {
        OR: [{ vin: { contains: term, mode: "insensitive" } }, { plate: { contains: term, mode: "insensitive" } }],
      },
      include: { make: true, model: true, customer: true },
      take: 8,
    }),
  ]);
  return { customers, providers, jobs, vehicles };
}

export async function getHqDashboard() {
  const [customers, providers, requests, active, verified, disputes, payments, failed] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.mechanicProfile.count(),
    prisma.serviceRequest.count(),
    prisma.job.count({ where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.mechanicProfile.count({ where: { verificationLevel: "POCKET_VERIFIED" } }),
    prisma.dispute.findMany({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } }, include: { job: true } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true, commissionCents: true } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
  ]);
  const awaitingEstimates = await prisma.job.count({ where: { status: "AWAITING_APPROVAL" } });
  const applications = await prisma.verificationApplication.count({
    where: { status: { in: ["APPLICATION_RECEIVED", "REVIEWING", "VISIT_SCHEDULING"] } },
  });
  const unmatched = await prisma.serviceRequest.count({ where: { status: "OPEN" } });
  const attention = [
    disputes.filter((item) => Date.now() - item.createdAt.getTime() > 48 * 3600 * 1000).length
      ? { href: "/admin/disputes", label: `${disputes.length} open Assurance claims`, tone: "danger" as const }
      : null,
    failed ? { href: "/admin/payments", label: `${failed} failed payments`, tone: "warning" as const } : null,
    applications ? { href: "/admin/verification", label: `${applications} verification applications waiting`, tone: "accent" as const } : null,
    unmatched ? { href: "/admin/marketplace", label: `${unmatched} unmatched requests`, tone: "warning" as const } : null,
    awaitingEstimates ? { href: "/admin/jobs", label: `${awaitingEstimates} estimates waiting`, tone: "accent" as const } : null,
  ].filter(Boolean);

  const byCategory = await prisma.serviceRequest.groupBy({ by: ["category"], _count: { _all: true } });
  const topProviders = await prisma.mechanicProfile.findMany({
    orderBy: { completedJobsCount: "desc" },
    take: 5,
  });

  return {
    metrics: {
      customers,
      providers,
      requests,
      active,
      gmvCents: payments._sum.amountCents ?? 0,
      revenueCents: payments._sum.commissionCents ?? 0,
      verified,
    },
    attention,
    disputes: disputes.length,
    byCategory,
    topProviders,
  };
}
