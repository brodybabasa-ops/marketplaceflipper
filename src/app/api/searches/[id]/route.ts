import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { errorResponse, httpError, json } from "@/lib/http";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const search = await prisma.savedSearch.findUnique({ where: { id } });
    if (!search || search.userId !== user.id) return errorResponse("Not found", 404);
    await prisma.savedSearch.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return httpError(error);
  }
}
