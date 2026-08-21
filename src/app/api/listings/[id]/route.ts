import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { errorResponse, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(`listing:${clientIp(request)}`, 120);
  if (!limited.ok) return errorResponse("Too many requests", 429);

  const { id } = await context.params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      priceHistory: { orderBy: { recordedAt: "asc" } },
      duplicateOf: { include: { duplicateOf: true } },
    },
  });

  if (!listing) return errorResponse("Listing not found", 404);

  const session = await getSession();
  const favorited = session
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { userId_listingId: { userId: session.id, listingId: listing.id } },
        }),
      )
    : false;

  return json({ ...listing, favorited });
}
