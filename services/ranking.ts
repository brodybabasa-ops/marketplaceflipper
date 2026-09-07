import type { VerificationLevel } from "@prisma/client";
import { DEFAULT_RANKING_WEIGHTS } from "@/lib/constants";

export type RankingWeights = typeof DEFAULT_RANKING_WEIGHTS;

export type RankingInputs = {
  averageRating: number;
  completedJobsCount: number;
  onTimePercentage: number;
  estimateAccuracy: number;
  customerRepeatRate: number;
  reviewQualityScore: number;
  verificationLevel: VerificationLevel;
  avgResponseMinutes: number;
  cancellationRate: number;
};

const VERIFICATION_SCORE: Record<VerificationLevel, number> = {
  UNVERIFIED: 0.08,
  PROFILE_VERIFIED: 0.45,
  PROFESSIONAL_VERIFIED: 0.7,
  INSURED: 0.85,
  POCKET_VERIFIED: 1,
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function jobsComponent(count: number) {
  return clamp01(Math.log10(count + 1) / Math.log10(201));
}

function responseComponent(minutes: number) {
  return clamp01(1 - minutes / (24 * 60));
}

export function computeMechanicScore(input: RankingInputs, weights: RankingWeights = DEFAULT_RANKING_WEIGHTS) {
  const parts = {
    rating: clamp01(input.averageRating / 5),
    completedJobs: jobsComponent(input.completedJobsCount),
    onTime: clamp01(input.onTimePercentage / 100),
    estimateAccuracy: clamp01(input.estimateAccuracy / 100),
    repeatRate: clamp01(input.customerRepeatRate / 100),
    reviewQuality: clamp01(input.reviewQualityScore / 100),
    verification: VERIFICATION_SCORE[input.verificationLevel],
    responseTime: responseComponent(input.avgResponseMinutes),
    cancellationRate: clamp01(1 - input.cancellationRate / 100),
  };

  const score =
    100 *
    (parts.rating * weights.rating +
      parts.completedJobs * weights.completedJobs +
      parts.onTime * weights.onTime +
      parts.estimateAccuracy * weights.estimateAccuracy +
      parts.repeatRate * weights.repeatRate +
      parts.reviewQuality * weights.reviewQuality +
      parts.verification * weights.verification +
      parts.responseTime * weights.responseTime +
      parts.cancellationRate * weights.cancellationRate);

  return Math.round(score * 10) / 10;
}

export type MechanicSort =
  | "recommended"
  | "rating"
  | "closest"
  | "experienced"
  | "price";

export function compareMechanics<
  T extends {
    mechanicScore: number;
    averageRating: number;
    completedJobsCount: number;
    yearsExperience: number;
    startingPriceCents: number;
    distanceMiles?: number | null;
    isSponsored?: boolean;
  },
>(sort: MechanicSort) {
  return (a: T, b: T) => {
    switch (sort) {
      case "rating":
        return b.averageRating - a.averageRating || b.mechanicScore - a.mechanicScore;
      case "closest":
        return (a.distanceMiles ?? 9999) - (b.distanceMiles ?? 9999);
      case "experienced":
        return b.yearsExperience - a.yearsExperience || b.completedJobsCount - a.completedJobsCount;
      case "price":
        return a.startingPriceCents - b.startingPriceCents;
      default:
        return b.mechanicScore - a.mechanicScore;
    }
  };
}
