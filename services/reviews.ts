import { prisma } from "@/lib/db";
import { refreshMechanicScore } from "@/services/mechanics";

export async function createReview(input: {
  jobId: string;
  customerId: string;
  overallRating: number;
  communicationRating: number;
  professionalismRating: number;
  pricingRating: number;
  timelinessRating: number;
  qualityRating: number;
  wouldUseAgain: boolean;
  body: string;
}) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: input.jobId },
    include: { review: true, repairRecord: true },
  });

  if (job.customerId !== input.customerId) throw new Error("Not authorized.");
  if (job.status !== "COMPLETED") throw new Error("Reviews are only allowed after a completed Pocket Mechanic job.");
  if (job.review) throw new Error("This job already has a review.");
  if (job.customerId === job.mechanicUserId) throw new Error("You cannot review your own work.");

  const review = await prisma.review.create({
    data: {
      jobId: job.id,
      customerId: input.customerId,
      mechanicProfileId: job.mechanicProfileId,
      overallRating: input.overallRating,
      communicationRating: input.communicationRating,
      professionalismRating: input.professionalismRating,
      pricingRating: input.pricingRating,
      timelinessRating: input.timelinessRating,
      qualityRating: input.qualityRating,
      wouldUseAgain: input.wouldUseAgain,
      body: input.body,
      repairSummary: job.repairRecord?.title,
      priceCents: job.totalCents,
    },
  });

  const stats = await prisma.review.aggregate({
    where: { mechanicProfileId: job.mechanicProfileId, hidden: false },
    _avg: { overallRating: true, qualityRating: true },
    _count: true,
  });

  const repeat = await prisma.review.count({
    where: { mechanicProfileId: job.mechanicProfileId, wouldUseAgain: true, hidden: false },
  });

  await prisma.mechanicProfile.update({
    where: { id: job.mechanicProfileId },
    data: {
      averageRating: stats._avg.overallRating ?? input.overallRating,
      reviewCount: stats._count,
      reviewQualityScore: (stats._avg.qualityRating ?? input.qualityRating) * 20,
      customerRepeatRate: stats._count ? (repeat / stats._count) * 100 : 0,
    },
  });
  await refreshMechanicScore(job.mechanicProfileId);
  return review;
}
