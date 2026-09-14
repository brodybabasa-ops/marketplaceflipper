import type { ServiceCategory, ServiceMode, VerificationLevel } from "@prisma/client";
import { haversineMiles, type Coordinates } from "@/lib/geo";
import { compareMechanics, type MechanicSort } from "@/services/ranking";

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
};

export type MechanicMatch = MatchableMechanic & {
  distanceMiles: number;
  reasons: string[];
  isBestMatch: boolean;
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
};

function verificationLabel(level: VerificationLevel) {
  if (level === "POCKET_VERIFIED") return "Pocket Verified";
  if (level === "UNVERIFIED") return null;
  return "Verified mechanic";
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
  } else if (mechanic.makeNames[0]) {
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
  const verified = verificationLabel(mechanic.verificationLevel);
  if (verified) reasons.push(verified);
  return reasons.slice(0, 5);
}

export function matchMechanics(mechanics: MatchableMechanic[], filters: MatchFilters = {}): MechanicMatch[] {
  const origin = filters.origin;
  const sort = filters.sort ?? "recommended";

  const filtered = mechanics
    .map((mechanic) => {
      const distanceMiles = origin
        ? haversineMiles(origin, { latitude: mechanic.latitude, longitude: mechanic.longitude })
        : 0;
      return { mechanic, distanceMiles };
    })
    .filter(({ mechanic, distanceMiles }) => {
      if (origin && distanceMiles > mechanic.serviceRadiusMiles) return false;
      if (filters.maxDistanceMiles != null && distanceMiles > filters.maxDistanceMiles) return false;
      if (filters.category && !mechanic.specialties.includes(filters.category) && !mechanic.specialties.includes("DIAGNOSTICS")) {
        return false;
      }
      if (filters.makeName && !mechanic.makeNames.some((name) => name.toLowerCase() === filters.makeName?.toLowerCase())) {
        return mechanic.specialties.includes("DIAGNOSTICS");
      }
      if (filters.serviceMode && filters.serviceMode !== "ANY") {
        if (mechanic.serviceMode !== "BOTH" && mechanic.serviceMode !== filters.serviceMode) return false;
      }
      if (filters.minRating != null && mechanic.averageRating < filters.minRating) return false;
      if (filters.verifiedOnly && mechanic.verificationLevel === "UNVERIFIED") return false;
      if (filters.maxPriceCents != null && mechanic.startingPriceCents > filters.maxPriceCents) return false;
      if (filters.availableDay && !mechanic.availabilityDays.includes(filters.availableDay)) return false;
      return true;
    });

  const ranked = filtered
    .map(({ mechanic, distanceMiles }) => ({
      ...mechanic,
      distanceMiles,
      reasons: recommendationReasons(mechanic, distanceMiles, filters),
      isBestMatch: false,
    }))
    .sort(compareMechanics(sort));

  const bestCount = Math.min(3, ranked.length);
  return ranked.map((item, index) => ({ ...item, isBestMatch: index < bestCount && sort === "recommended" }));
}

export function responseTimeLabel(minutes: number) {
  return responseCopy(minutes);
}
