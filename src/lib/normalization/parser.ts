import type { NormalizedVehicle } from "@/types/listing";
import {
  findMake,
  findModel,
  findTrim,
  wordIncludes,
} from "@/lib/normalization/catalog";

const CURRENT_YEAR = new Date().getFullYear();

const DRIVETRAIN_PATTERNS: Array<[RegExp, string]> = [
  [/\b(4x4|4wd|four[-\s]?wheel)\b/i, "4WD"],
  [/\b(awd|all[-\s]?wheel)\b/i, "AWD"],
  [/\b(rwd|rear[-\s]?wheel)\b/i, "RWD"],
  [/\b(fwd|front[-\s]?wheel)\b/i, "FWD"],
];

const TRANSMISSION_PATTERNS: Array<[RegExp, string]> = [
  [/\b(automatic|auto|10[-\s]?speed|8[-\s]?speed|6[-\s]?speed auto)\b/i, "Automatic"],
  [/\b(manual|stick|6[-\s]?speed|5[-\s]?speed|mt)\b/i, "Manual"],
  [/\b(cvt)\b/i, "CVT"],
];

const FUEL_PATTERNS: Array<[RegExp, string]> = [
  [/\b(diesel|power\s?stroke|cummins|duramax)\b/i, "Diesel"],
  [/\b(hybrid|powerboost|prime)\b/i, "Hybrid"],
  [/\b(plugin|plug-in|phev|4xe)\b/i, "PHEV"],
  [/\b(electric|ev|taycan|e-ray)\b/i, "Electric"],
  [/\b(gas|gasoline|unleaded|v6|v8|ecoboost)\b/i, "Gasoline"],
];

const CONDITION_PATTERNS: Array<[RegExp, string]> = [
  [/\b(new|brand new)\b/i, "New"],
  [/\b(like new|excellent)\b/i, "Excellent"],
  [/\b(clean title|very good|good condition)\b/i, "Good"],
  [/\b(fair|needs work|project)\b/i, "Fair"],
  [/\b(salvage|rebuilt|flood|lemon)\b/i, "Salvage"],
];

function extractYear(text: string): number | null {
  const matches = text.match(/\b(19[89]\d|20[0-2]\d)\b/g);
  if (!matches) return null;
  const years = matches
    .map(Number)
    .filter((year) => year >= 1985 && year <= CURRENT_YEAR + 1);
  return years[0] ?? null;
}

function extractMileage(text: string): number | null {
  const patterns = [
    /\b([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:miles|mi)?\b/i,
    /\b([0-9]{4,6})\s*(?:miles|mi)\b/i,
    /\b([0-9]{2,3})k\s*(?:miles|mi)?\b/i,
    /\blow miles\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    if (pattern.source.includes("low miles")) return null;
    const raw = match[1];
    if (!raw) continue;
    if (raw.toLowerCase().endsWith("k") || /k\s*(?:miles|mi)?/i.test(match[0])) {
      const thousands = Number(raw.replace(/k/i, ""));
      return Number.isFinite(thousands) ? thousands * 1000 : null;
    }
    const value = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(value) && value >= 0 && value <= 500_000) return value;
  }
  return null;
}

function extractEngine(text: string): string | null {
  const diesel = text.match(/\b(6\.7|6\.6|5\.9)\s*(?:l(?:iter)?)?\s*(power\s?stroke|cummins|duramax)?\b/i);
  if (diesel) {
    const liters = diesel[1];
    const family = diesel[2]?.replace(/\s+/g, " ");
    if (family) {
      const named = family.toLowerCase().includes("power")
        ? "Power Stroke"
        : family.charAt(0).toUpperCase() + family.slice(1).toLowerCase();
      return `${liters}L ${named}`;
    }
    if (/\bdiesel\b/i.test(text) && liters === "6.7") return "6.7L Power Stroke";
    return `${liters}L`;
  }

  const eco = text.match(/\b(2\.7|3\.5|3\.0)\s*(?:l(?:iter)?)?\s*(ecoboost|powerboost)?\b/i);
  if (eco) {
    const family = eco[2] ? ` ${eco[2][0].toUpperCase()}${eco[2].slice(1)}` : "";
    return `${eco[1]}L${family}`;
  }

  const generic = text.match(/\b(\d\.\d)\s*l(?:iter)?\b/i);
  if (generic) return `${generic[1]}L`;

  const cylinders = text.match(/\b(v6|v8|i4|i6)\b/i);
  if (cylinders) return cylinders[1].toUpperCase();

  return null;
}

function firstMatch(text: string, patterns: Array<[RegExp, string]>): string | null {
  for (const [pattern, value] of patterns) {
    if (pattern.test(text)) return value;
  }
  return null;
}

function confidenceOf(fields: NormalizedVehicle) {
  const scored = [
    fields.year,
    fields.make,
    fields.model,
    fields.trim,
    fields.mileage,
    fields.drivetrain,
    fields.engine,
    fields.bodyStyle,
  ];
  const present = scored.filter((value) => value != null).length;
  return Number((present / scored.length).toFixed(2));
}

export function parseVehicleText(
  title: string,
  description?: string | null,
): NormalizedVehicle {
  const text = `${title}\n${description ?? ""}`;
  const make = findMake(text);
  const modelHit = findModel(text, make);
  const resolvedMake = make ?? modelHit?.make ?? null;
  const resolvedModel = modelHit?.model ?? null;
  const trim = findTrim(text, resolvedModel);

  const engineFromCatalog =
    resolvedModel?.engines?.find((engine) =>
      wordIncludes(text.toLowerCase(), engine.toLowerCase()),
    ) ?? null;

  const normalized: NormalizedVehicle = {
    year: extractYear(title) ?? extractYear(text),
    make: resolvedMake?.name ?? null,
    model: resolvedModel?.name ?? null,
    trim,
    mileage: extractMileage(text),
    engine: engineFromCatalog ?? extractEngine(text),
    drivetrain: firstMatch(text, DRIVETRAIN_PATTERNS),
    transmission: firstMatch(text, TRANSMISSION_PATTERNS),
    fuelType: firstMatch(text, FUEL_PATTERNS),
    bodyStyle: resolvedModel?.bodyStyle ?? null,
    condition: firstMatch(text, CONDITION_PATTERNS),
    confidence: 0,
  };

  if (normalized.engine?.toLowerCase().includes("power stroke") || normalized.engine?.toLowerCase().includes("cummins") || normalized.engine?.toLowerCase().includes("duramax")) {
    normalized.fuelType = normalized.fuelType ?? "Diesel";
  }

  normalized.confidence = confidenceOf(normalized);
  return normalized;
}

export function mergeNormalized(
  provided: Partial<NormalizedVehicle>,
  parsed: NormalizedVehicle,
): NormalizedVehicle {
  const merged: NormalizedVehicle = {
    year: provided.year ?? parsed.year,
    make: provided.make ?? parsed.make,
    model: provided.model ?? parsed.model,
    trim: provided.trim ?? parsed.trim,
    mileage: provided.mileage ?? parsed.mileage,
    engine: provided.engine ?? parsed.engine,
    drivetrain: provided.drivetrain ?? parsed.drivetrain,
    transmission: provided.transmission ?? parsed.transmission,
    fuelType: provided.fuelType ?? parsed.fuelType,
    bodyStyle: provided.bodyStyle ?? parsed.bodyStyle,
    condition: provided.condition ?? parsed.condition,
    confidence: parsed.confidence,
  };
  merged.confidence = confidenceOf(merged);
  return merged;
}
