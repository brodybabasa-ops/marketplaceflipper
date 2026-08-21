import type { Listing } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { ListingCard } from "@/components/listings/ListingCard";
import { AppShell } from "@/components/layout/AppShell";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export function DashboardHome({
  user,
  listings,
  stats,
}: {
  user: SessionUser;
  listings: Listing[];
  stats: { count: number; highProfit: number; recent: number; spread: number };
}) {
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <AppShell
      user={user}
      rightRail={
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold">Alerts</h2>
            <p className="mt-3 text-sm text-slate-400">
              New matches appear here when a listing hits a saved search.
            </p>
          </section>
          <section>
            <h2 className="text-sm font-semibold">Saved searches</h2>
            <Link href="/account" className="mt-3 block text-sm text-cyan-300">
              Manage searches
            </Link>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Market insight</p>
            <p className="mt-2 text-sm">Truck prices are moving. Watch Super Duty comps this week.</p>
          </section>
        </div>
      }
    >
      <p className="text-sm text-slate-400">Welcome back, {firstName} 👋</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Deals near you</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Deals found" value={String(stats.count)} hint="Active listings" />
        <Stat label="High profit" value={String(stats.highProfit)} hint="Deal score 70+" />
        <Stat label="Fresh today" value={String(stats.recent)} hint="Listed in 24h" />
        <Stat label="Est. spread" value={formatPrice(stats.spread)} hint="Below estimated market" />
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Tab href="/search" label={`All Deals (${stats.count})`} active />
        <Tab href="/search?sort=dealScore" label={`High Profit (${stats.highProfit})`} />
        <Tab href="/account" label="Watched" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-profit">{hint}</p>
    </div>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-profit px-4 py-1.5 text-sm font-medium text-emerald-950"
          : "rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-300"
      }
    >
      {label}
    </Link>
  );
}
