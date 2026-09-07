import { isVisionDemoEnabled } from "@/lib/vision";

/** Labeled development fixtures. Never treat these as production intelligence. */
export function visionFixtures() {
  if (!isVisionDemoEnabled()) return null;
  return {
    labeled: true as const,
    notice: "Development fixture — not live market, valuation, recall, or financing data.",
    marketplace: [
      { market: "Salt Lake City", industry: "Automotive", metric: "Brake demand", value: "↑14%", note: "Seasonal fixture" },
      { market: "Salt Lake City", industry: "Marine", metric: "Winterization", value: "↑180%", note: "Seasonal fixture" },
      { market: "Wasatch", industry: "Powersports", metric: "UTV repair wait", value: "6.2 days", note: "Coverage fixture" },
      { market: "Boise", industry: "Automotive", metric: "Diesel coverage", value: "LOW", note: "Recruiting fixture" },
    ],
    providersNeeded: [
      {
        market: "Boise, Idaho",
        need: "3 diesel specialists",
        reason: "High request volume, low acceptance, long wait times",
        demand: "HIGH",
        coverage: "LOW",
      },
    ],
    priceExamples: [
      { taxonomyKey: "BRAKES", label: "Front brake replacement", minCents: 68000, maxCents: 81000, sampleSize: 24, region: "Salt Lake metro" },
    ],
    membershipBenefits: [
      "Maintenance monitoring",
      "Priority support",
      "Roadside routing",
      "Enhanced asset reports",
    ],
    walletNote: "Pocket Mechanic is not a bank. Wallet, credits, and a maintenance fund would run through regulated partners.",
    financingNote: "Pocket Mechanic is not the lender. Financing would be offered by regulated partners at authorization.",
    valuationNote: "Asset values require a licensed data partner. None is connected.",
    recallNote: "Recalls require manufacturer data. None is connected.",
  };
}

export function fixtureBadge(provenance: string) {
  if (provenance === "DEMO_FIXTURE") return "Development fixture";
  if (provenance === "VERIFIED_TRANSACTION") return "From verified Pocket Mechanic repairs";
  if (provenance === "INTEGRATION") return "From a connected partner";
  return "Computed from records on this account";
}
