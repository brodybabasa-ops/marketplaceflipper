import { prisma } from "@/lib/db";

export async function getMechanicAnalytics(mechanicProfileId: string, mechanicUserId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [profile, jobs, reviews, payouts, requests, completedAll] = await Promise.all([
    prisma.mechanicProfile.findUniqueOrThrow({ where: { id: mechanicProfileId } }),
    prisma.job.findMany({
      where: { mechanicProfileId, createdAt: { gte: sixMonthsAgo } },
      select: { status: true, totalCents: true, createdAt: true, completedAt: true, paymentStatus: true },
    }),
    prisma.review.findMany({
      where: { mechanicProfileId, hidden: false },
      select: {
        overallRating: true,
        communicationRating: true,
        professionalismRating: true,
        pricingRating: true,
        timelinessRating: true,
        qualityRating: true,
        wouldUseAgain: true,
      },
    }),
    prisma.payout.aggregate({
      where: { mechanicUserId, status: "PAID" },
      _sum: { amountCents: true, commissionCents: true },
    }),
    prisma.job.count({ where: { mechanicProfileId } }),
    prisma.job.count({ where: { mechanicProfileId, status: "COMPLETED" } }),
  ]);

  const completed = jobs.filter((job) => job.status === "COMPLETED");
  const monthJobs = jobs.filter((job) => job.createdAt >= startOfMonth);
  const monthRevenue = completed
    .filter((job) => (job.completedAt ?? job.createdAt) >= startOfMonth)
    .reduce((sum, job) => sum + job.totalCents, 0);

  const byMonth = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const monthJobsForKey = jobs.filter((job) => `${job.createdAt.getFullYear()}-${job.createdAt.getMonth()}` === key);
    const monthCompleted = completed.filter((job) => {
      const stamp = job.completedAt ?? job.createdAt;
      return `${stamp.getFullYear()}-${stamp.getMonth()}` === key;
    });
    return {
      label: date.toLocaleString("en-US", { month: "short" }),
      jobs: monthJobsForKey.length,
      revenueCents: monthCompleted.reduce((sum, job) => sum + job.totalCents, 0),
    };
  });

  const avg = (key: keyof (typeof reviews)[number]) => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + Number(review[key]), 0) / reviews.length;
  };

  return {
    profile,
    totals: {
      requests,
      completed: completedAll,
      conversion: requests ? Math.round((completedAll / requests) * 100) : 0,
      monthJobs: monthJobs.length,
      monthRevenueCents: monthRevenue,
      paidOutCents: payouts._sum.amountCents ?? 0,
      commissionCents: payouts._sum.commissionCents ?? 0,
    },
    ratings: {
      overall: avg("overallRating"),
      communication: avg("communicationRating"),
      professionalism: avg("professionalismRating"),
      pricing: avg("pricingRating"),
      timeliness: avg("timelinessRating"),
      quality: avg("qualityRating"),
      wouldUseAgain: reviews.length ? Math.round((reviews.filter((item) => item.wouldUseAgain).length / reviews.length) * 100) : 0,
      count: reviews.length,
    },
    byMonth,
  };
}

export async function getPlatformAnalytics() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [usersByRole, mechanics, jobs, disputesByStatus, payments, reviews, windowJobs] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.mechanicProfile.count(),
    prisma.job.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.dispute.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true, commissionCents: true },
    }),
    prisma.review.aggregate({ _avg: { overallRating: true }, _count: true }),
    prisma.job.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true, totalCents: true, completedAt: true, paymentStatus: true },
    }),
  ]);

  const completed = jobs.find((item) => item.status === "COMPLETED")?._count._all ?? 0;
  const openDisputes = disputesByStatus
    .filter((item) => item.status === "OPEN" || item.status === "UNDER_REVIEW")
    .reduce((sum, item) => sum + item._count._all, 0);

  const byMonth = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const monthJobs = windowJobs.filter((job) => `${job.createdAt.getFullYear()}-${job.createdAt.getMonth()}` === key);
    const monthPaid = monthJobs.filter((job) => job.status === "COMPLETED" && job.paymentStatus === "PAID");
    return {
      label: date.toLocaleString("en-US", { month: "short" }),
      jobs: monthJobs.length,
      revenueCents: monthPaid.reduce((sum, job) => sum + job.totalCents, 0),
    };
  });

  return {
    totals: {
      users: usersByRole.reduce((sum, item) => sum + item._count._all, 0),
      mechanics,
      jobs: jobs.reduce((sum, item) => sum + item._count._all, 0),
      completed,
      openDisputes,
      grossCents: payments._sum.amountCents ?? 0,
      commissionCents: payments._sum.commissionCents ?? 0,
      averageRating: reviews._avg.overallRating ?? 0,
    },
    usersByRole: usersByRole.map((item) => ({ role: item.role, count: item._count._all })),
    disputesByStatus: disputesByStatus.map((item) => ({ status: item.status, count: item._count._all })),
    byMonth,
  };
}
