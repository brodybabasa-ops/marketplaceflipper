import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { DirectorySearchBar, type DirectoryQuery } from "@/components/mechanics/directory-search";
import { DirectoryFilters, AutoSubmitSelect } from "@/components/mechanics/directory-filters";
import { DirectoryMap } from "@/components/mechanics/directory-map";
import { EmptyState } from "@/components/ui/card";
import { LANDING_LOCATION } from "@/lib/landing";
import type { DirectoryShop } from "@/services/landing";

export function DirectoryPage({
  query,
  shops,
  locationLabel,
  origin,
}: {
  query: DirectoryQuery;
  shops: DirectoryShop[];
  locationLabel: string;
  origin: { latitude: number; longitude: number; city: string } | null;
}) {
  const visible = shops.slice(0, 12);
  return (
    <div data-landing className="bg-[#071422] text-white">
      <Hero />
      <div className="relative z-10 mx-auto -mt-14 max-w-[1280px] px-4 pb-8 sm:-mt-16 sm:px-6">
        <DirectorySearchBar query={query} />
        <form action="/mechanics" className="mt-6 rounded-[28px] bg-[#eef2f6] p-4 text-navy sm:p-5">
          <CommittedSearch query={query} />
          <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
            <DirectoryFilters query={query} />
            <Results shops={visible} total={shops.length} locationLabel={locationLabel} query={query} />
            <aside className="space-y-4">
              <DirectoryMap shops={visible} origin={origin} />
              <Link href="/request" className="block overflow-hidden rounded-2xl bg-[#102033] p-5 text-white">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#7eb0ff]">
                  <Wrench className="h-4 w-4" />
                  Need a custom repair?
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Can&apos;t find exactly what you need? Send a request and we&apos;ll help you find the right shop.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white">
                  Request a Shop
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link href="/for-mechanics" className="block overflow-hidden rounded-2xl bg-[#102033] text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/shop-1.png" alt="" className="h-28 w-full object-cover" />
                <span className="block p-5">
                  <span className="block text-sm font-semibold">Shops: Want to be listed?</span>
                  <span className="mt-1 block text-sm text-white/70">
                    Join thousands of repair shops growing with Pocket Mechanic.
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#7eb0ff]">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            </aside>
          </div>
        </form>
      </div>
      <TrustBar />
    </div>
  );
}

function CommittedSearch({ query }: { query: DirectoryQuery }) {
  return (
    <>
      <input type="hidden" name="zip" value={query.zip ?? LANDING_LOCATION} />
      {query.vehicleType ? <input type="hidden" name="vehicleType" value={query.vehicleType} /> : null}
      {query.vehicle ? <input type="hidden" name="vehicle" value={query.vehicle} /> : null}
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-20 sm:pb-24 sm:pt-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/hero-truck.png"
        alt="Pickup truck on a mountain road at sunset"
        className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.92)_0%,rgba(7,20,34,0.68)_42%,rgba(7,20,34,0.22)_100%)]" />
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
        <h1 className="max-w-xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[56px]">
          Find the <span className="text-[#2f7bff]">Right Shop</span>
        </h1>
        <p className="mt-3 text-lg text-white/80">Trusted. Local. Verified. Get back to what you love.</p>
        <p className="font-script mt-3 text-2xl text-white/90">Same Roads. Different Machines. Same Solution.</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#2f7bff]" />
            Verified Shops
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 text-[#2f7bff]" />
            Real Customer Reviews
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-[#2f7bff]" />
            Book Appointments
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-[#2f7bff]" />
            Get Estimates
          </span>
        </div>
      </div>
    </section>
  );
}

function Results({
  shops,
  total,
  locationLabel,
  query,
}: {
  shops: DirectoryShop[];
  total: number;
  locationLabel: string;
  query: DirectoryQuery;
}) {
  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-navy">
          Showing {total} shop{total === 1 ? "" : "s"} near {locationLabel}
        </p>
        <label className="text-sm text-muted">
          Sort by:{" "}
          <AutoSubmitSelect
            name="sort"
            defaultValue={query.sort ?? "closest"}
            className="rounded-lg border border-line bg-white px-2 py-1 font-semibold text-navy"
          >
            <option value="recommended">Best Match</option>
            <option value="closest">Closest</option>
            <option value="rating">Highest rated</option>
            <option value="experienced">Most experienced</option>
          </AutoSubmitSelect>
        </label>
      </div>
      {shops.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No shops matched those filters"
            body="Try All Shops, a wider distance, or a different service. Dealerships are not in the current directory."
          />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {shops.map((shop) => (
            <article
              key={shop.slug}
              className="grid overflow-hidden rounded-2xl border border-line bg-white text-navy shadow-[0_10px_30px_rgba(14,28,47,0.06)] md:grid-cols-[138px_minmax(0,1fr)_186px]"
            >
              <div className="relative min-h-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shop.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="px-4 py-3">
                {shop.verified ? (
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </p>
                ) : null}
                {shop.sponsored ? (
                  <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-warning">Sponsored</span>
                ) : null}
                <h2 className="text-lg font-bold leading-tight">{shop.businessName}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-navy">{shop.averageRating.toFixed(1)}</span>
                  <span>({shop.reviewCount} reviews)</span>
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {shop.distanceLabel}
                  {shop.distanceLabel ? " · " : ""}
                  {shop.city}, {shop.state}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {shop.specialties.map((item) => (
                    <span key={item} className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-semibold">
                      {item}
                    </span>
                  ))}
                  {shop.serviceMode === "MOBILE" ? (
                    <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-semibold">Mobile</span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-1.5 border-t border-line px-4 py-3 md:border-l md:border-t-0">
                {shop.openNow ? (
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-success text-[9px] text-white">✓</span>
                    Open Now
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-muted">Currently closed</p>
                )}
                <p className="text-xs text-muted">Earliest Availability</p>
                <p className="text-sm font-semibold text-navy">{shop.availabilityLabel}</p>
                <Link href={`/mechanics/${shop.slug}`} className="text-sm font-semibold text-[#2f7bff]">
                  View Availability
                </Link>
                <Link
                  href={`/mechanics/${shop.slug}`}
                  className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-[#2f7bff] text-sm font-semibold text-white hover:bg-[#2568e8]"
                >
                  View Shop →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-t border-white/10 bg-[#071422]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              [ShieldCheck, "Verified Shops", "Shops you can trust"],
              [Star, "Real Reviews", "From real customers"],
              [ClipboardList, "Transparent information", "Know before you book"],
              [CalendarCheck, "Easy Booking", "Get it done"],
            ] as const
          ).map(([Icon, title, body]) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 text-[#2f7bff]" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-white/60">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="font-script mt-6 text-2xl text-white/90">Get It Fixed. Get Back Out There.</p>
      </div>
    </section>
  );
}
