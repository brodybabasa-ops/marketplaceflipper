import { NextRequest } from "next/server";
import { z } from "zod";
import { createSession, findUserByEmail, verifyPassword } from "@/lib/auth/session";
import { errorResponse, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(`login:${clientIp(request)}`, 10, 60_000);
  if (!limited.ok) return errorResponse("Too many login attempts", 429);

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return errorResponse("Invalid credentials", 422);

  const user = await findUserByEmail(body.data.email);
  if (!user || !(await verifyPassword(body.data.password, user.passwordHash))) {
    logger.warn("auth.login_failed", { emailDomain: body.data.email.split("@")[1] });
    return errorResponse("Invalid email or password", 401);
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
