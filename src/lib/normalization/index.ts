import type { NormalizedVehicle, RawListing } from "@/types/listing";
import { logger } from "@/lib/logger";
import { aiNormalizeListing } from "@/lib/normalization/ai";
import { mergeNormalized, parseVehicleText } from "@/lib/normalization/parser";

const AI_CONFIDENCE_THRESHOLD = 0.8;

export async function normalizeListing(raw: RawListing): Promise<NormalizedVehicle> {
  const parsed = parseVehicleText(raw.title, raw.description);
  const merged = mergeNormalized(
    {
      year: raw.year ?? parsed.year,
      make: raw.make ?? parsed.make,
      model: raw.model ?? parsed.model,
      trim: raw.trim ?? parsed.trim,
      mileage: raw.mileage ?? parsed.mileage,
      category: raw.category ?? parsed.category,
      condition: raw.condition ?? parsed.condition,
    },
    parsed,
  );

  if (merged.confidence >= AI_CONFIDENCE_THRESHOLD) {
    return merged;
  }

  const ai = await aiNormalizeListing({
    title: raw.title,
    description: raw.description,
  });

  if (!ai) return merged;

  logger.info("normalization.ai_applied", {
    source: raw.source,
    sourceListingId: raw.sourceListingId,
    confidence: ai.confidence,
  });

  return mergeNormalized(merged, ai);
}
