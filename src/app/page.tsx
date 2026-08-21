import { ListingCard } from "@/components/listings/ListingCard";
import { SearchHero } from "@/components/search/SearchHero";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, count] = await Promise.all([
    prisma.listing.findMany({
      where: { listingStatus: "active", dealScore: { gte: 70 } },
      orderBy: { dealScore: "desc" },
      take: 6,
    }),
    prisma.listing.count({ where: { listingStatus: "active" } }),
  ]);

  return (
    <div>
      <SearchHero />
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Active listings" value={count.toLocaleString()} />
          <Stat label="Connected sources" value="Mock inventory" />
          <Stat label="Transactions" value="On the original listing" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Deal desk</p>
            <h2 className="mt-1 font-[family-name:var(--font-instrument)] text-3xl">
              Strong relative values
            </h2>
          </div>
          <Link href="/search?sort=dealScore" className="text-sm text-muted hover:text-foreground">
            View all
          </Link>
        </div>
        <div className="grid gap-4">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
