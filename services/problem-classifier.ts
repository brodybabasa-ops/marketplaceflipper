import type { ServiceCategory } from "@prisma/client";

type Rule = { category: ServiceCategory; keywords: string[] };

const RULES: Rule[] = [
  { category: "BRAKES", keywords: ["brake", "grinding when i turn", "grinding when i stop", "squeal", "shakes when braking", "shake when braking", "soft pedal", "abs"] },
  { category: "STARTING", keywords: ["won't start", "wont start", "cranks but", "clicking", "no start", "doesn't fire", "doesnt fire"] },
  { category: "CHARGING", keywords: ["dead battery", "battery", "alternator", "dim lights", "won't hold a charge"] },
  { category: "ENGINE", keywords: ["check engine", "misfire", "rough idle", "loss of power", "smoke", "oil leak", "knock"] },
  { category: "TRANSMISSION", keywords: ["transmission", "shifting", "slip", "won't go into gear", "delayed engagement"] },
  { category: "ELECTRICAL", keywords: ["electrical", "sensor", "wiring", "fuse", "short", "dashboard light"] },
  { category: "SUSPENSION", keywords: ["suspension", "bounce", "clunk", "strut", "shock", "uneven ride"] },
  { category: "STEERING", keywords: ["steering", "pulls to", "wander", "power steering", "when i turn"] },
  { category: "COOLING", keywords: ["overheat", "coolant", "radiator", "temperature", "heater core"] },
  { category: "AC_HEATING", keywords: ["ac ", "a/c", "air conditioning", "no cold air", "heater", "heat not working"] },
  { category: "TIRES", keywords: ["tire", "puncture", "alignment", "vibration on the highway", "cupping"] },
  { category: "MAINTENANCE", keywords: ["oil change", "oil service", "tune up", "inspection", "maintenance", "fluids"] },
  { category: "DIAGNOSTICS", keywords: ["not sure", "unknown", "diagnos", "check it out", "weird noise"] },
];

export function classifyProblem(text: string): ServiceCategory {
  const haystack = text.toLowerCase();
  let best: { category: ServiceCategory; hits: number } | null = null;
  for (const rule of RULES) {
    const hits = rule.keywords.filter((keyword) => haystack.includes(keyword)).length;
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { category: rule.category, hits };
    }
  }
  return best?.category ?? "OTHER";
}

export function categoryLabel(category: ServiceCategory) {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" & ");
}
