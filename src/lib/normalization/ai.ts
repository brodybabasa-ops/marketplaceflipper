import type { NormalizedVehicle } from "@/types/listing";
import { logger } from "@/lib/logger";

const AI_SCHEMA_HINT = `{
  "year": number | null,
  "make": string | null,
  "model": string | null,
  "trim": string | null,
  "mileage": number | null,
  "engine": string | null,
  "drivetrain": string | null,
  "transmission": string | null,
  "fuelType": string | null,
  "bodyStyle": string | null,
  "condition": string | null,
  "confidence": number
}`;

export async function aiNormalizeListing(input: {
  title: string;
  description?: string | null;
}): Promise<NormalizedVehicle | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const body = {
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract structured vehicle fields from a marketplace listing. Never invent missing information. If a field is not clearly present, return null. Do not use seller names, phone numbers, or other personal details. Return JSON only matching this shape: " +
          AI_SCHEMA_HINT,
      },
      {
        role: "user",
        content: `Title: ${input.title}\nDescription: ${truncate(input.description ?? "", 2500)}`,
      },
    ],
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      logger.warn("normalization.ai_failed", { status: response.status });
      return null;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Partial<NormalizedVehicle>;
    return {
      year: numOrNull(parsed.year),
      make: strOrNull(parsed.make),
      model: strOrNull(parsed.model),
      trim: strOrNull(parsed.trim),
      mileage: numOrNull(parsed.mileage),
      engine: strOrNull(parsed.engine),
      drivetrain: strOrNull(parsed.drivetrain),
      transmission: strOrNull(parsed.transmission),
      fuelType: strOrNull(parsed.fuelType),
      bodyStyle: strOrNull(parsed.bodyStyle),
      condition: strOrNull(parsed.condition),
      confidence: clampConfidence(parsed.confidence),
    };
  } catch (error) {
    logger.error("normalization.ai_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clampConfidence(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}
