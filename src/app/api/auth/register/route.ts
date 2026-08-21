import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createSession, hashPassword } from "@/lib/auth/session";
import { errorResponse, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(`register:${clientIp(request)}`, 8, 60_000);
  if (!limited.ok) return errorResponse("Too many attempts", 429);

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return errorResponse("Invalid registration details", 422);

  const email = body.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return errorResponse("An account with that email already exists", 409);

  const user = await prisma.user.create({
    data: {
      email,
      name: body.data.name,
      passwordHash: await hashPassword(body.data.password),
      role: "user",
    },
  });

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return json({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 });
}
