import type { ServiceCategory, ServiceMode, VerificationLevel } from "@prisma/client";
import { haversineMiles, type Coordinates } from "@/lib/geo";
import { compareMechanics, type MechanicSort } from "@/services/ranking";
import { matchExplanation } from "@/services/trust-graph";

export type MatchableMechanic = {
  id: string;
  slug: string;
  businessName: string;
  firstName: string;
  lastName: string;
  bio: string;
  yearsExperience: number;
  serviceMode: ServiceMode;
  verificationLevel: VerificationLevel;
  isSelect: boolean;
  isFoundingProvider: boolean;
  foundingNumber: number | null;
  lastVerifiedAt: Date | null;
  averageRating: number;
  reviewCount: number;
  completedJobsCount: number;
  startingPriceCents: number;
  avgResponseMinutes: number;
  mechanicScore: number;
  profilePhotoUrl: string | null;
  latitude: number;
  longitude: number;
  serviceRadiusMiles: number;
  specialties: ServiceCategory[];
  makeNames: string[];
  availabilityDays: string[];
  isSponsored: boolean;
  industryKeys: string[];
  verifiedIndustryKeys: string[];
};

export type MechanicMatch = MatchableMechanic & {
  distanceMiles: number;
  reasons: string[];
  isBestMatch: boolean;
  precisionNote: string | null;
};

export type MatchFilters = {
  origin?: Coordinates | null;
  category?: ServiceCategory | null;
  makeName?: string | null;
  serviceMode?: ServiceMode | "ANY" | null;
  minRating?: number | null;
  verifiedOnly?: boolean;
  maxPriceCents?: number | null;
  maxDistanceMiles?: number | null;
  availableDay?: string | null;
  sort?: MechanicSort;
  industryKey?: string | null;
  taxonomyKey?: string | null;
};

function verificationLabel(level: VerificationLevel, industryKey?: string | null, verifiedIndustryKeys: string[] = []) {
  if (industryKey && industryKey !== "AUTOMOTIVE") {
    return verifiedIndustryKeys.includes(industryKey) ? `Pocket Mechanic Verified ${industryTitle(industryKey)}` : null;
  }
  if (level === "POCKET_VERIFIED" || verifiedIndustryKeys.includes("AUTOMOTIVE")) return "Pocket Mechanic Verified";
  return null;
}

function industryTitle(key: string) {
  return key
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function responseCopy(minutes: number) {
  if (minutes <= 15) return "Usually responds within 15 min";
  if (minutes <= 60) return `Usually responds within ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Usually responds within ${hours} hour${hours === 1 ? "" : "s"}`;
}

export function recommendationReasons(mechanic: MatchableMechanic, distanceMiles: number, filters: MatchFilters) {
  const reasons: string[] = [];
  if (filters.makeName && mechanic.makeNames.some((name) => name.toLowerCase() === filters.makeName?.toLowerCase())) {
    reasons.push(`Specializes in ${filters.makeName}`);
  } else if (mechanic.makeNames[0] && (!filters.industryKey || filters.industryKey === "AUTOMOTIVE")) {
    reasons.push(`Experienced with ${mechanic.makeNames.slice(0, 2).join(" and ")}`);
  }
  if (mechanic.completedJobsCount > 0) {
    reasons.push(`${mechanic.completedJobsCount.toLocaleString()} completed jobs`);
  }
  if (mechanic.averageRating >= 4.5) {
    reasons.push(`${mechanic.averageRating.toFixed(1)} rating`);
  }
  if (Number.isFinite(distanceMiles)) {
    reasons.push(`${Math.max(1, Math.round(distanceMiles))} miles away`);
  }
  if (filters.availableDay && mechanic.availabilityDays.includes(filters.availableDay)) {
    reasons.push(`Available ${filters.availableDay.toLowerCase()}`);
  }
  const verified = verificationLabel(mechanic.verificationLevel, filters.industryKey, mechanic.verifiedIndustryKeys);
  if (verified) reasons.push(verified);
  if (mechanic.isSelect) reasons.push("Pocket Mechanic Select");
  if (mechanic.isFoundingProvider && mechanic.foundingNumber) {
    reasons.push(`Founding Mechanic #${String(mechanic.foundingNumber).padStart(3, "0")}`);
  }
  return reasons.slice(0, 6);
}

export function matchMechanics(mechanics: MatchableMechanic[], filters: MatchFilters = {}): MechanicMatch[] {
  const origin = filters.origin;
  const sort = filters.sort ?? "recommended";
  const industryKey = filters.industryKey ?? "AUTOMOTIVE";

  const filtered = mechanics
    .map((mechanic) => {
      const distanceMiles = origin
        ? haversineMiles(origin, { latitude: mechanic.latitude, longitude: mechanic.longitude })
        : 0;
      return { mechanic, distanceMiles };
    })
    .filter(({ mechanic, distanceMiles }) => {
      const serves = mechanic.industryKeys.length ? mechanic.industryKeys : ["AUTOMOTIVE"];
      if (!serves.includes(industryKey)) return false;
      if (origin && distanceMiles > mechanic.serviceRadiusMiles) return false;
      if (filters.maxDistanceMiles != null && distanceMiles > filters.maxDistanceMiles) return false;
      if (industryKey === "AUTOMOTIVE" && filters.category && !mechanic.specialties.includes(filters.category) && !mechanic.specialties.includes("DIAGNOSTICS")) {
        return false;
      }
      if (filters.makeName && industryKey === "AUTOMOTIVE" && !mechanic.makeNames.some((name) => name.toLowerCase() === filters.makeName?.toLowerCase())) {
        return mechanic.specialties.includes("DIAGNOSTICS");
      }
      if (filters.serviceMode && filters.serviceMode !== "ANY") {
        if (mechanic.serviceMode !== "BOTH" && mechanic.serviceMode !== filters.serviceMode) return false;
      }
      if (filters.minRating != null && mechanic.averageRating < filters.minRating) return false;
      if (filters.verifiedOnly) {
        if (industryKey !== "AUTOMOTIVE") {
          if (!mechanic.verifiedIndustryKeys.includes(industryKey)) return false;
        } else if (mechanic.verificationLevel === "UNVERIFIED" && !mechanic.verifiedIndustryKeys.includes("AUTOMOTIVE")) {
          return false;
        }
      }
      if (filters.maxPriceCents != null && mechanic.startingPriceCents > filters.maxPriceCents) return false;
      if (filters.availableDay && !mechanic.availabilityDays.includes(filters.availableDay)) return false;
      return true;
    });

  const ranked = filtered
    .map(({ mechanic, distanceMiles }) => {
      const reasons = recommendationReasons(mechanic, distanceMiles, filters);
      const explanation = matchExplanation({
        reasons,
        verified: Boolean(verificationLabel(mechanic.verificationLevel, filters.industryKey, mechanic.verifiedIndustryKeys)),
        select: mechanic.isSelect,
        rating: mechanic.averageRating,
        distanceMiles,
        responseMinutes: mechanic.avgResponseMinutes,
      });
      return {
        ...mechanic,
        distanceMiles,
        reasons: explanation.chips,
        precisionNote: explanation.precisionNote,
        isBestMatch: false,
      };
    })
    .sort(compareMechanics(sort));

  const bestCount = Math.min(3, ranked.length);
  return ranked.map((item, index) => ({ ...item, isBestMatch: index < bestCount && sort === "recommended" }));
}

export function responseTimeLabel(minutes: number) {
  return responseCopy(minutes);
}

export function isVerifiedForIndustry(
  mechanic: Pick<MatchableMechanic, "verificationLevel" | "verifiedIndustryKeys">,
  industryKey: string,
) {
  if (industryKey === "AUTOMOTIVE") {
    return mechanic.verificationLevel === "POCKET_VERIFIED" || mechanic.verifiedIndustryKeys.includes("AUTOMOTIVE");
  }
  return mechanic.verifiedIndustryKeys.includes(industryKey);
}
