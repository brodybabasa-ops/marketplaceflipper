import { getSession } from "@/lib/auth/session";
import { json } from "@/lib/http";

export async function GET() {
  const session = await getSession();
  return json({ user: session });
}
