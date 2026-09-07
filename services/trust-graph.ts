import type { ExpertiseBand, ServiceCategory } from "@prisma/client";
import { prisma } from "@/lib/db";

const THRESHOLD = 8;

export function expertiseBand(count: number, resolutionRate?: number | null): ExpertiseBand {
  if (count < 3) return "INSUFFICIENT_DATA";
  if (count < THRESHOLD) return "LIMITED_HISTORY";
  if (resolutionRate != null && resolutionRate >= 0.95 && count >= 40) return "EXCEPTIONAL";
  if (count >= 25) return "ADVANCED";
  return "COMPETENT";
}

export function bandLabel(band: ExpertiseBand) {
  return band.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export async function providerTrustGraph(mechanicProfileId: string) {
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: mechanicProfileId },
    include: { industries: { include: { industry: true } } },
  });
  const [jobs, outcomes, disputes] = await Promise.all([
    prisma.job.findMany({
      where: { mechanicProfileId, status: "COMPLETED" },
      include: {
        serviceRequest: { include: { industry: true } },
        asset: true,
        vehicle: { include: { make: true } },
      },
    }),
    prisma.repairOutcome.findMany({ where: { mechanicProfileId } }),
    prisma.dispute.count({ where: { mechanicId: profile.userId } }),
  ]);

  const byCategory = new Map<string, number>();
  const byMake = new Map<string, number>();
  const byIndustry = new Map<string, number>();
  for (const job of jobs) {
    const category = job.serviceRequest.category;
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    const make = job.asset?.manufacturer ?? job.vehicle?.make.name;
    if (make) byMake.set(make, (byMake.get(make) ?? 0) + 1);
    const industry = job.serviceRequest.industry?.key ?? "AUTOMOTIVE";
    byIndustry.set(industry, (byIndustry.get(industry) ?? 0) + 1);
  }

  const resolved = outcomes.filter((item) => item.resolved === "YES").length;
  const resolutionRate = outcomes.length ? resolved / outcomes.length : null;
  const completed = jobs.length;
  const cancelled = await prisma.job.count({ where: { mechanicProfileId, status: "CANCELLED" } });
  const requested = await prisma.job.count({ where: { mechanicProfileId } });

  const categoryExpertise = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: key.replaceAll("_", " "),
      count,
      band: expertiseBand(count, resolutionRate),
    }));
  const makeExpertise = [...byMake.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: key,
      count,
      band: expertiseBand(count, resolutionRate),
    }));

  return {
    mechanicProfileId,
    completedVerifiedRepairs: completed,
    resolutionRate,
    completionRate: requested ? (completed / requested) * 100 : null,
    cancellationRate: requested ? (cancelled / requested) * 100 : profile.cancellationRate,
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    avgResponseMinutes: profile.avgResponseMinutes,
    disputeCount: disputes,
    categoryExpertise,
    makeExpertise,
    industryKeys: profile.industries.map((item) => item.industry.key),
    verifiedIndustryKeys: profile.industries.filter((item) => item.verified).map((item) => item.industry.key),
    isSelect: profile.isSelect,
    verificationLevel: profile.verificationLevel,
  };
}

export function matchExplanation(input: {
  reasons: string[];
  completedSimilar?: number;
  verified?: boolean;
  select?: boolean;
  rating?: number;
  distanceMiles?: number;
  responseMinutes?: number;
}) {
  const chips = [...input.reasons];
  if (input.completedSimilar && input.completedSimilar >= 3) {
    chips.unshift(`${input.completedSimilar} similar verified repairs`);
  }
  return {
    chips: chips.slice(0, 6),
    precisionNote:
      (input.completedSimilar ?? 0) < 3
        ? "Match reasons come from profile and distance. Similar-repair history is still thin, so Pocket Mechanic is not showing a fake percentage."
        : null,
  };
}

export async function similarRepairCount(mechanicProfileId: string, category: ServiceCategory, manufacturer?: string | null) {
  return prisma.job.count({
    where: {
      mechanicProfileId,
      status: "COMPLETED",
      serviceRequest: { category },
      ...(manufacturer
        ? { OR: [{ asset: { manufacturer: { equals: manufacturer, mode: "insensitive" } } }, { vehicle: { make: { name: { equals: manufacturer, mode: "insensitive" } } } }] }
        : {}),
    },
  });
}
