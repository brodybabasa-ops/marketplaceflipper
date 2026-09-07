import type { JobStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeMechanicScore } from "@/services/ranking";
import { DEFAULT_RANKING_WEIGHTS } from "@/lib/constants";
import type { MatchableMechanic } from "@/services/matching";

const mechanicCardInclude = {
  user: { select: { firstName: true, lastName: true } },
  specialties: true,
  makeExpertise: { include: { make: true } },
  availability: true,
} satisfies Prisma.MechanicProfileInclude;

export function toMatchableMechanic(
  profile: Prisma.MechanicProfileGetPayload<{ include: typeof mechanicCardInclude }>,
): MatchableMechanic {
  return {
    id: profile.id,
    slug: profile.slug,
    businessName: profile.businessName,
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    bio: profile.bio,
    yearsExperience: profile.yearsExperience,
    serviceMode: profile.serviceMode,
    verificationLevel: profile.verificationLevel,
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    completedJobsCount: profile.completedJobsCount,
    startingPriceCents: profile.startingPriceCents,
    avgResponseMinutes: profile.avgResponseMinutes,
    mechanicScore: profile.mechanicScore,
    profilePhotoUrl: profile.profilePhotoUrl,
    latitude: profile.latitude,
    longitude: profile.longitude,
    serviceRadiusMiles: profile.serviceRadiusMiles,
    specialties: profile.specialties.map((item) => item.category),
    makeNames: profile.makeExpertise.map((item) => item.make.name),
    availabilityDays: profile.availability.map((item) => item.dayOfWeek),
    isSponsored: profile.isSponsored,
  };
}

export async function listMechanicsForMatching() {
  const profiles = await prisma.mechanicProfile.findMany({
    where: { user: { status: "ACTIVE" } },
    include: mechanicCardInclude,
  });
  return profiles.map(toMatchableMechanic);
}

export async function getMechanicBySlug(slug: string) {
  return prisma.mechanicProfile.findUnique({
    where: { slug },
    include: {
      user: true,
      specialties: true,
      certifications: true,
      serviceAreas: true,
      availability: true,
      makeExpertise: { include: { make: true } },
      reviews: {
        where: { hidden: false },
        include: { customer: true, response: true, job: { include: { vehicle: { include: { make: true, model: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function refreshMechanicScore(mechanicProfileId: string) {
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { id: mechanicProfileId },
  });
  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  const weights = (config?.rankingWeights as typeof DEFAULT_RANKING_WEIGHTS | null) ?? DEFAULT_RANKING_WEIGHTS;
  const mechanicScore = computeMechanicScore(profile, weights);
  return prisma.mechanicProfile.update({
    where: { id: mechanicProfileId },
    data: { mechanicScore },
  });
}

export async function getPublicStats() {
  const [stored, live] = await Promise.all([
    prisma.platformStat.findUnique({ where: { id: "public" } }),
    prisma.$transaction([
      prisma.review.aggregate({ _avg: { overallRating: true } }),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.mechanicProfile.count({ where: { user: { status: "ACTIVE" } } }),
    ]),
  ]);
  return {
    averageRating: stored?.averageRating ?? live[0]._avg.overallRating ?? 4.9,
    verifiedJobsCount: Math.max(stored?.verifiedJobsCount ?? 0, live[1]),
    mechanicCount: Math.max(stored?.mechanicCount ?? 0, live[2]),
    statesCovered: stored?.statesCovered ?? 50,
  };
}

export const ALLOWED_JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  REQUESTED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["DIAGNOSING", "CANCELLED"],
  DIAGNOSING: ["AWAITING_APPROVAL", "IN_PROGRESS", "CANCELLED"],
  AWAITING_APPROVAL: ["IN_PROGRESS", "CANCELLED", "DISPUTED"],
  IN_PROGRESS: ["AWAITING_APPROVAL", "COMPLETED", "DISPUTED", "CANCELLED"],
  COMPLETED: ["DISPUTED"],
  CANCELLED: [],
  DISPUTED: ["COMPLETED", "CANCELLED"],
};
