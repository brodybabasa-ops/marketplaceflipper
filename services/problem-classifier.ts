import type { ServiceCategory } from "@prisma/client";
import { TAXONOMY, type IndustryKey } from "@/lib/catalog";

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

const INDUSTRY_RULES: Record<string, { key: string; keywords: string[] }[]> = {
  MARINE: [
    { key: "IMPELLER", keywords: ["impeller", "overheat", "no water", "pee stream"] },
    { key: "SURF_SYSTEM", keywords: ["surf", "ballast", "wake", "won't get on plane", "wont get on plane", "on plane"] },
    { key: "WINTERIZATION", keywords: ["winterize", "dewinter", "winterization"] },
    { key: "TRAILER", keywords: ["trailer", "bearing", "bunk"] },
    { key: "ENGINE", keywords: ["outboard", "sterndrive", "inboard", "engine", "no start", "won't start"] },
    { key: "ELECTRICAL", keywords: ["battery", "charging", "electrical"] },
    { key: "ANNUAL_SERVICE", keywords: ["annual", "season", "tune"] },
  ],
  POWERSPORTS: [
    { key: "ENGINE", keywords: ["hard to start", "hot", "top end", "bottom end", "no start"] },
    { key: "DRIVELINE", keywords: ["chain", "sprocket", "clutch", "belt"] },
    { key: "SUSPENSION", keywords: ["fork", "shock", "linkage"] },
    { key: "ELECTRICAL", keywords: ["battery", "spark", "ignition"] },
    { key: "MAINTENANCE", keywords: ["oil", "filter", "maintenance"] },
  ],
  RV: [
    { key: "SLIDES", keywords: ["slide", "retract", "leveling"] },
    { key: "GENERATOR", keywords: ["generator"] },
    { key: "HVAC", keywords: ["ac", "furnace", "hvac"] },
    { key: "PLUMBING", keywords: ["leak", "tank", "water", "plumbing"] },
    { key: "ELECTRICAL", keywords: ["battery", "converter", "electrical"] },
    { key: "CHASSIS", keywords: ["chassis", "engine", "brake"] },
  ],
  HEAVY_EQUIPMENT: [
    { key: "HYDRAULICS", keywords: ["hydraulic", "pressure", "drift", "lift"] },
    { key: "UNDERCARRIAGE", keywords: ["track", "undercarriage", "final drive"] },
    { key: "ENGINE", keywords: ["engine", "no start", "smoke"] },
    { key: "ELECTRICAL", keywords: ["electrical", "sensor"] },
    { key: "PM", keywords: ["pm", "maintenance", "service"] },
  ],
};

const AUTO_CATEGORY_TO_TAXONOMY: Partial<Record<ServiceCategory, string>> = {
  BRAKES: "BRAKES",
  ENGINE: "ENGINE",
  STARTING: "ENGINE",
  TRANSMISSION: "TRANSMISSION",
  ELECTRICAL: "ELECTRICAL",
  CHARGING: "ELECTRICAL",
  SUSPENSION: "SUSPENSION",
  STEERING: "SUSPENSION",
  MAINTENANCE: "MAINTENANCE",
  DIAGNOSTICS: "DIAGNOSTICS",
  TIRES: "BRAKES",
  COOLING: "ENGINE",
  AC_HEATING: "ENGINE",
};

export function classifyProblem(text: string, industryKey: string = "AUTOMOTIVE"): ServiceCategory {
  if (industryKey !== "AUTOMOTIVE") {
    const taxonomy = classifyTaxonomy(text, industryKey);
    if (taxonomy === "ELECTRICAL") return "ELECTRICAL";
    if (taxonomy === "ENGINE" || taxonomy === "IMPELLER") return "ENGINE";
    if (taxonomy === "SUSPENSION") return "SUSPENSION";
    if (taxonomy === "MAINTENANCE" || taxonomy === "ANNUAL_SERVICE" || taxonomy === "PM") return "MAINTENANCE";
    if (taxonomy === "HYDRAULICS") return "OTHER";
    return "OTHER";
  }
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

export function classifyTaxonomy(text: string, industryKey: string = "AUTOMOTIVE"): string {
  const haystack = text.toLowerCase();
  const rules = INDUSTRY_RULES[industryKey];
  if (rules) {
    let best: { key: string; hits: number } | null = null;
    for (const rule of rules) {
      const hits = rule.keywords.filter((keyword) => haystack.includes(keyword)).length;
      if (hits > 0 && (!best || hits > best.hits)) best = { key: rule.key, hits };
    }
    if (best) return best.key;
  }
  if (industryKey === "AUTOMOTIVE") {
    return AUTO_CATEGORY_TO_TAXONOMY[classifyProblem(text)] ?? "DIAGNOSTICS";
  }
  return TAXONOMY.find((item) => item.industry === industryKey)?.key ?? "ENGINE";
}

export function classifyNeed(text: string, industryKey: string = "AUTOMOTIVE") {
  const category = classifyProblem(text, industryKey);
  const taxonomyKey = classifyTaxonomy(text, industryKey);
  return { category, taxonomyKey, industryKey: industryKey as IndustryKey };
}

export function categoryLabel(category: ServiceCategory) {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" & ");
}
