import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession, clearSession } from "@/lib/auth/session";
import { ListingCard } from "@/components/listings/ListingCard";
import { AccountActions } from "@/components/account/AccountActions";
import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const [searches, favorites] = await Promise.all([
    prisma.savedSearch.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId: session.id },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <AppShell user={session}>
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Account</p>
          <h1 className="mt-1 text-3xl font-semibold">
            {session.name || session.email}
          </h1>
        </div>
        <form
          action={async () => {
            "use server";
            await clearSession();
            redirect("/");
          }}
        >
          <button type="submit" className="rounded-full border border-white/15 px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Saved searches</h2>
        <div className="mt-4 grid gap-3">
          {searches.length === 0 ? (
            <p className="text-sm text-muted">
              Save a search from the results page to get new listing alerts.
            </p>
          ) : (
            searches.map((search) => (
              <div key={search.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{search.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      Email alerts {search.notifyEmail ? "on" : "off"}
                      {search.lastNotifiedAt
                        ? ` · last notice ${search.lastNotifiedAt.toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <AccountActions id={search.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Favorites</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.length === 0 ? (
            <p className="text-sm text-muted">
              <Link href="/search" className="underline">
                Browse listings
              </Link>{" "}
              and save the ones worth a second look.
            </p>
          ) : (
            favorites.map((item) => <ListingCard key={item.id} listing={item.listing} />)
          )}
        </div>
      </section>
    </div>
    </AppShell>
  );
}
