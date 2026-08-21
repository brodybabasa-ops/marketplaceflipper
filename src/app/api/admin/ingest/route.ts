import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { ingestSource } from "@/lib/ingestion/pipeline";
import { errorResponse, httpError, json } from "@/lib/http";

const schema = z.object({
  source: z.string().trim().min(1).max(40).default("mock"),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.safeParse(await request.json().catch(() => ({ source: "mock" })));
    if (!body.success) return errorResponse("Invalid ingest request", 422);
    const result = await ingestSource(body.data.source);
    return json(result);
  } catch (error) {
    return httpError(error);
  }
}
