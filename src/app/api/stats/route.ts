import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { httpError, json } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalListings,
      newToday,
      activeListings,
      bySource,
      failedJobs,
      duplicates,
      avgDeal,
      searchVolume,
      userCount,
      savedSearches,
      alertVolume,
    ] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.listing.count({ where: { listingStatus: "active" } }),
      prisma.listing.groupBy({ by: ["source"], _count: true }),
      prisma.ingestionJob.count({ where: { status: "failed" } }),
      prisma.duplicateFlag.count(),
      prisma.listing.aggregate({ _avg: { dealScore: true } }),
      prisma.searchEvent.count(),
      prisma.user.count(),
      prisma.savedSearch.count(),
      prisma.notification.count(),
    ]);

    return json({
      totalListings,
      newToday,
      activeListings,
      bySource: Object.fromEntries(bySource.map((row) => [row.source, row._count])),
      failedIngestionJobs: failedJobs,
      duplicateListings: duplicates,
      averageDealScore: avgDeal._avg.dealScore ? Math.round(avgDeal._avg.dealScore) : null,
      searchVolume,
      userCount,
      savedSearches,
      alertVolume,
    });
  } catch (error) {
    return httpError(error);
  }
}
