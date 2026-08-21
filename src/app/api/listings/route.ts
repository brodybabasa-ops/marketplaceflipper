import { NextRequest } from "next/server";
import { searchListings } from "@/lib/search/query";
import { parseSearchParams } from "@/lib/search/params";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { errorResponse, json } from "@/lib/http";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const limited = rateLimit(`listings:${clientIp(request)}`, 90);
  if (!limited.ok) return errorResponse("Too many requests", 429);

  try {
    const params = parseSearchParams(request.nextUrl.searchParams);
    const result = await searchListings(params);
    return json(result);
  } catch (error) {
    logger.error("api.listings.error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return errorResponse("Unable to search listings", 500);
  }
}
