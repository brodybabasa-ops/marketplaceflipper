import Link from "next/link";
import type { Listing } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { HeroSearch } from "@/components/home/HeroSearch";
import { CategoryRibbon } from "@/components/home/CategoryRibbon";
import { FeatureRow } from "@/components/home/FeatureRow";
import { ListingCard } from "@/components/listings/ListingCard";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [featured, count, highProfit, recent, spread] = await Promise.all([
    prisma.listing.findMany({
      where: { listingStatus: "active" },
      orderBy: { dealScore: "desc" },
      take: 8,
    }),
    prisma.listing.count({ where: { listingStatus: "active" } }),
    prisma.listing.count({ where: { listingStatus: "active", dealScore: { gte: 70 } } }),
    prisma.listing.count({
      where: { listingStatus: "active", createdAt: { gte: startOfDay } },
    }),
    prisma.listing.aggregate({
      _sum: { marketPriceDelta: true },
      where: { listingStatus: "active", marketPriceDelta: { lt: 0 } },
    }),
  ]);

  if (session) {
    return (
      <DashboardHome
        user={session}
        listings={featured}
        stats={{ count, highProfit, recent, spread: Math.abs(spread._sum.marketPriceDelta ?? 0) }}
      />
    );
  }

  return (
    <div>
      <MarketingNav />
      <HeroSearch />
      <CategoryRibbon />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Live deals</p>
            <h2 className="mt-2 text-2xl font-semibold">Top flip opportunities</h2>
          </div>
          <Link href="/search?sort=dealScore" className="text-sm text-slate-400 hover:text-white">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((listing: Listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
      <FeatureRow />
      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        FlipFinder is a search layer. Transactions happen on the original marketplace.
      </footer>
    </div>
  );
}
