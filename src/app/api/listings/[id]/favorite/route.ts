import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { errorResponse, httpError, json } from "@/lib/http";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return errorResponse("Listing not found", 404);

    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: id } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return json({ favorited: false });
    }

    await prisma.favorite.create({ data: { userId: user.id, listingId: id } });
    return json({ favorited: true });
  } catch (error) {
    return httpError(error);
  }
}
