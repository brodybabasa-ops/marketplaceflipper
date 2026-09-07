import { prisma } from "@/lib/db";
import { isVisionDemoEnabled } from "@/lib/vision";
import { visionFixtures, fixtureBadge } from "@/lib/vision-fixtures";

const MIN_SAMPLE = 5;

export async function fairPriceFor(input: {
  industryKey: string;
  taxonomyKey: string;
  estimateCents: number;
  region?: string;
}) {
  const completed = await prisma.job.findMany({
    where: {
      status: "COMPLETED",
      totalCents: { gt: 0 },
      serviceRequest: { taxonomyKey: input.taxonomyKey, industry: { key: input.industryKey } },
    },
    select: { totalCents: true },
    take: 80,
  });
  if (completed.length >= MIN_SAMPLE) {
    const amounts = completed.map((item) => item.totalCents).sort((a, b) => a - b);
    const minCents = amounts[Math.floor(amounts.length * 0.2)];
    const maxCents = amounts[Math.floor(amounts.length * 0.8)];
    return explainRange({
      estimateCents: input.estimateCents,
      minCents,
      maxCents,
      sampleSize: amounts.length,
      provenance: "VERIFIED_TRANSACTION" as const,
      region: input.region ?? "this market",
    });
  }

  const stored = await prisma.priceBenchmark.findFirst({
    where: { industryKey: input.industryKey, taxonomyKey: input.taxonomyKey, provenance: "VERIFIED_TRANSACTION" },
  });
  if (stored && stored.sampleSize >= MIN_SAMPLE) {
    return explainRange({
      estimateCents: input.estimateCents,
      minCents: stored.minCents,
      maxCents: stored.maxCents,
      sampleSize: stored.sampleSize,
      provenance: "VERIFIED_TRANSACTION",
      region: stored.region,
    });
  }

  if (isVisionDemoEnabled()) {
    const fixture = visionFixtures()?.priceExamples.find((item) => item.taxonomyKey === input.taxonomyKey);
    if (fixture) {
      return explainRange({
        estimateCents: input.estimateCents,
        minCents: fixture.minCents,
        maxCents: fixture.maxCents,
        sampleSize: fixture.sampleSize,
        provenance: "DEMO_FIXTURE",
        region: fixture.region,
      });
    }
  }

  return {
    available: false as const,
    reason: "Not enough comparable verified Pocket Mechanic repairs yet to show a price range.",
  };
}

function explainRange(input: {
  estimateCents: number;
  minCents: number;
  maxCents: number;
  sampleSize: number;
  provenance: "VERIFIED_TRANSACTION" | "DEMO_FIXTURE";
  region: string;
}) {
  const within = input.estimateCents >= input.minCents && input.estimateCents <= input.maxCents;
  return {
    available: true as const,
    estimateCents: input.estimateCents,
    minCents: input.minCents,
    maxCents: input.maxCents,
    sampleSize: input.sampleSize,
    provenance: input.provenance,
    badge: fixtureBadge(input.provenance),
    region: input.region,
    within,
    headline: within ? "In typical range" : "Outside typical range",
    explanation: within
      ? "This estimate falls within comparable verified Pocket Mechanic repairs locally."
      : "Differences can come from OEM vs aftermarket parts, extra required work, unusual labor, asset configuration, or local market differences. This is not an accusation of overcharging.",
  };
}
