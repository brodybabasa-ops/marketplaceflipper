import assert from "node:assert/strict";
import { test } from "node:test";
import { formatUsage } from "../lib/asset-display";
import { healthFromFindings } from "../services/assets";
import { garageHeadline } from "../lib/catalog";
import { classifyNeed, classifyProblem, classifyTaxonomy } from "../services/problem-classifier";
import { isVerifiedForIndustry, matchMechanics, type MatchableMechanic } from "../services/matching";
import type { ServiceCategory, ServiceMode, VerificationLevel } from "@prisma/client";

function mechanic(partial: Partial<MatchableMechanic> & Pick<MatchableMechanic, "id" | "businessName" | "industryKeys">): MatchableMechanic {
  return {
    slug: partial.id,
    firstName: "Test",
    lastName: "Provider",
    bio: "Independent technician.",
    yearsExperience: 10,
    serviceMode: "MOBILE" as ServiceMode,
    verificationLevel: "UNVERIFIED" as VerificationLevel,
    isSelect: false,
    isFoundingProvider: false,
    foundingNumber: null,
    lastVerifiedAt: null,
    averageRating: 4.8,
    reviewCount: 12,
    completedJobsCount: 40,
    startingPriceCents: 9500,
    avgResponseMinutes: 15,
    mechanicScore: 80,
    profilePhotoUrl: null,
    latitude: 40.76,
    longitude: -111.89,
    serviceRadiusMiles: 30,
    specialties: ["ENGINE", "DIAGNOSTICS"] as ServiceCategory[],
    makeNames: ["Ford"],
    availabilityDays: ["MONDAY"],
    isSponsored: false,
    verifiedIndustryKeys: [],
    ...partial,
  };
}

test("usage formatting does not assume miles", () => {
  assert.equal(formatUsage(126000, "MILES"), "126,000 miles");
  assert.equal(formatUsage(428, "ENGINE_HOURS"), "428 engine hours");
  assert.equal(formatUsage(3840, "OPERATING_HOURS"), "3,840 operating hours");
  assert.equal(formatUsage(91, "ENGINE_HOURS"), "91 engine hours");
});

test("garage headline stays simple for automotive-only customers", () => {
  const auto = garageHeadline(["AUTOMOTIVE"]);
  assert.equal(auto.title, "My Garage");
  assert.match(auto.body, /vehicles/i);
  assert.equal(auto.addLabel, "Add vehicle");
  const mixed = garageHeadline(["AUTOMOTIVE", "MARINE"]);
  assert.match(mixed.body, /everything you own/i);
  assert.equal(mixed.addLabel, "Add to garage");
});

test("marine intake classifies boat language, not auto brakes", () => {
  assert.equal(classifyProblem("My truck shakes when braking."), "BRAKES");
  const marine = classifyNeed("My boat won't get on plane.", "MARINE");
  assert.equal(marine.taxonomyKey, "SURF_SYSTEM");
  assert.notEqual(marine.category, "BRAKES");
  assert.equal(classifyTaxonomy("My dirt bike is hard to start when hot.", "POWERSPORTS"), "ENGINE");
  assert.equal(classifyTaxonomy("My slide won't retract.", "RV"), "SLIDES");
  assert.equal(classifyTaxonomy("My skid steer loses hydraulic pressure when warm.", "HEAVY_EQUIPMENT"), "HYDRAULICS");
});

test("matching keeps providers who do not serve that industry out of results", () => {
  const autoShop = mechanic({ id: "auto", businessName: "Auto Only", industryKeys: ["AUTOMOTIVE"], verificationLevel: "POCKET_VERIFIED" });
  const marineShop = mechanic({
    id: "marine",
    businessName: "Great Salt Lake Marine",
    industryKeys: ["MARINE"],
    verifiedIndustryKeys: ["MARINE"],
    verificationLevel: "PROFESSIONAL_VERIFIED",
  });
  const mixed = mechanic({
    id: "mike",
    businessName: "Mike's Mobile Auto",
    industryKeys: ["AUTOMOTIVE", "MARINE", "POWERSPORTS"],
    verifiedIndustryKeys: ["AUTOMOTIVE"],
    verificationLevel: "POCKET_VERIFIED",
  });

  const autoMatches = matchMechanics([autoShop, marineShop, mixed], { industryKey: "AUTOMOTIVE" });
  assert.deepEqual(
    autoMatches.map((item) => item.id).sort(),
    ["auto", "mike"],
  );

  const marineMatches = matchMechanics([autoShop, marineShop, mixed], { industryKey: "MARINE" });
  assert.deepEqual(
    marineMatches.map((item) => item.id).sort(),
    ["marine", "mike"],
  );

  const verifiedMarine = matchMechanics([autoShop, marineShop, mixed], { industryKey: "MARINE", verifiedOnly: true });
  assert.deepEqual(
    verifiedMarine.map((item) => item.id),
    ["marine"],
  );
});

test("automotive verification is not inherited by marine", () => {
  const mike = mechanic({
    id: "mike",
    businessName: "Mike's Mobile Auto",
    industryKeys: ["AUTOMOTIVE", "MARINE"],
    verifiedIndustryKeys: ["AUTOMOTIVE"],
    verificationLevel: "POCKET_VERIFIED",
  });
  assert.equal(isVerifiedForIndustry(mike, "AUTOMOTIVE"), true);
  assert.equal(isVerifiedForIndustry(mike, "MARINE"), false);
});

test("asset health score is only computed from inspection findings", () => {
  const empty = healthFromFindings([]);
  assert.equal(empty.score, null);
  const scored = healthFromFindings([
    { section: "Brakes", status: "GOOD" },
    { section: "Tires", status: "MONITOR" },
    { section: "Battery", status: "NEEDS_ATTENTION" },
  ]);
  assert.equal(scored.score, 71);
  assert.equal(scored.label, "Fair");
});
