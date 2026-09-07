import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession, homeForRole } from "@/lib/session";

export const metadata = { title: "Permission denied" };

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const home = session ? homeForRole(session.role) : "/sign-in";
  const back = params.from && params.from.startsWith("/") ? params.from : home;
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Permission denied</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">That area isn’t for this account</h1>
      <p className="mt-2 text-sm text-muted">
        Pocket Mechanic keeps customer, provider, fleet, and HQ data isolated. Sign in with the right role, or go back to your home.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild>
          <Link href={home}>Go to my home</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={back}>Back</Link>
        </Button>
      </div>
    </div>
  );
}
