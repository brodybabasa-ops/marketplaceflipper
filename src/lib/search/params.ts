import { z } from "zod";
import { SORT_OPTIONS, type SearchParams } from "@/types/search";
import { resolveLocation } from "@/lib/geo";
import { VEHICLE_CATALOG, findMake, findModel } from "@/lib/normalization/catalog";

export const searchParamsSchema = z.object({
  keyword: z.string().trim().max(200).optional(),
  make: z.string().trim().max(80).optional(),
  model: z.string().trim().max(80).optional(),
  yearMin: z.coerce.number().int().min(1980).max(2030).optional(),
  yearMax: z.coerce.number().int().min(1980).max(2030).optional(),
  priceMin: z.coerce.number().int().min(0).max(10_000_000).optional(),
  priceMax: z.coerce.number().int().min(0).max(10_000_000).optional(),
  mileageMin: z.coerce.number().int().min(0).max(1_000_000).optional(),
  mileageMax: z.coerce.number().int().min(0).max(1_000_000).optional(),
  location: z.string().trim().max(120).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(1000).optional(),
  bodyStyle: z.string().trim().max(40).optional(),
  drivetrain: z.string().trim().max(20).optional(),
  transmission: z.string().trim().max(20).optional(),
  fuelType: z.string().trim().max(20).optional(),
  sellerType: z.enum(["private", "dealer", "unknown"]).optional(),
  source: z.string().trim().max(40).optional(),
  sort: z.enum(SORT_OPTIONS).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export function parseSearchParams(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): SearchParams {
  const raw =
    input instanceof URLSearchParams
      ? Object.fromEntries(input.entries())
      : Object.fromEntries(
          Object.entries(input).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : value,
          ]),
        );

  const parsed = searchParamsSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};
  const geo = resolveLocation(data.location);
  return {
    ...data,
    latitude: data.latitude ?? geo?.latitude,
    longitude: data.longitude ?? geo?.longitude,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 20,
    sort: data.sort ?? "newest",
  };
}

export function toSearchParams(data: SearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value == null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
}

export function parseNaturalQuery(query: string): SearchParams {
  const text = query.trim();
  const params: SearchParams = {};
  if (!text) return params;

  const yearRange = text.match(/\b(19[89]\d|20[0-2]\d)\s*[-–to]+\s*(19[89]\d|20[0-2]\d)\b/i);
  if (yearRange) {
    params.yearMin = Number(yearRange[1]);
    params.yearMax = Number(yearRange[2]);
  } else {
    const year = text.match(/\b(19[89]\d|20[0-2]\d)\b/);
    if (year) {
      params.yearMin = Number(year[1]);
      params.yearMax = Number(year[1]);
    }
  }

  const under = text.match(/\b(?:under|below|<)\s*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*(k)?\b/i);
  if (under) {
    const base = Number(under[1].replace(/,/g, ""));
    params.priceMax = under[2] ? base * 1000 : base;
  }

  const over = text.match(/\b(?:over|above|>)\s*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*(k)?\b/i);
  if (over) {
    const base = Number(over[1].replace(/,/g, ""));
    params.priceMin = over[2] ? base * 1000 : base;
  }

  const miles = text.match(/\bunder\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*(k)?\s*(?:miles|mi)\b/i);
  if (miles) {
    const base = Number(miles[1].replace(/,/g, ""));
    params.mileageMax = miles[2] ? base * 1000 : base;
  }

  const make = findMake(text);
  if (make) params.make = make.name;
  const model = findModel(text, make);
  if (model) {
    params.make = model.make.name;
    params.model = model.model.name;
  }

  if (!params.make && !params.model && !params.yearMin && !params.priceMax) {
    params.keyword = text;
  }

  return params;
}

export function makes() {
  return VEHICLE_CATALOG.map((make) => make.name);
}

export function modelsFor(makeName?: string) {
  const make = VEHICLE_CATALOG.find((item) => item.name === makeName);
  return make?.models.map((model) => model.name) ?? [];
}
