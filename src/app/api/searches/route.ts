import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { searchParamsSchema } from "@/lib/search/params";
import { errorResponse, httpError, json } from "@/lib/http";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  params: searchParamsSchema,
  notifyEmail: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const searches = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return json({ items: searches });
  } catch (error) {
    return httpError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.safeParse(await request.json());
    if (!body.success) return errorResponse("Invalid saved search", 422);
    const search = await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: body.data.name,
        params: body.data.params,
        notifyEmail: body.data.notifyEmail ?? true,
      },
    });
    return json(search, { status: 201 });
  } catch (error) {
    return httpError(error);
  }
}
