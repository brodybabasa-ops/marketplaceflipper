import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { httpError, json } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
    });
    return json({ items: favorites.map((item) => item.listing) });
  } catch (error) {
    return httpError(error);
  }
}
