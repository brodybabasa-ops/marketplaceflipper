import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  CalendarCheck,
  Car,
  Caravan,
  LocateFixed,
  MapPin,
  MoreHorizontal,
  Plus,
  Sailboat,
  ShieldCheck,
  Snowflake,
  Star,
  Tractor,
  Container,
  Wrench,
} from "lucide-react";
import { AppCard } from "@/components/customer-app/primitives";
import { HomeShopCard } from "@/components/customer-app/shop-card";
import { cn } from "@/lib/utils";
import type { DashboardVehicle } from "@/services/customer-dashboard";
import type { DirectoryShop, LandingReview } from "@/services/landing";

const CATEGORIES = [
  { label: "Auto", icon: Car, href: "/mechanics?type=auto" },
  { label: "Marine", icon: Sailboat, href: "/mechanics?type=marine" },
  { label: "Powersports", icon: Bike, href: "/mechanics?type=powersports" },
  { label: "RV", icon: Caravan, href: "/mechanics?type=rv" },
  { label: "Snow", icon: Snowflake, href: "/mechanics?q=snow" },
  { label: "Trailers", icon: Container, href: "/mechanics?q=trailer" },
  { label: "Heavy", icon: Tractor, href: "/mechanics?q=heavy" },
  { label: "More", icon: MoreHorizontal, href: "/mechanics" },
];

const STEPS = [
  { n: "1", title: "Tell us what's wrong", body: "Vehicle, issue and photos." },
  { n: "2", title: "Find the right shop", body: "Compare specialists, reviews, pricing and availability." },
  { n: "3", title: "Get it fixed", body: "Book, approve estimates, message and track the repair." },
];

export function CustomerHomeView({
  vehicles,
  shops,
  savedShopIds,
  reviews,
  location,
  zip,
}: {
  vehicles: DashboardVehicle[];
  shops: DirectoryShop[];
  savedShopIds: string[];
  reviews: LandingReview[];
  location: string;
  zip: string;
}) {
  const defaultVehicle = vehicles[0];
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-5 pt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/hero-truck.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[78%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,34,0.28)_0%,rgba(7,20,34,0.55)_38%,rgba(7,20,34,0.96)_100%)]" />
        <div className="relative">
          <p className="text-[11px] font-bold tracking-[0.22em] text-white/70">SOMETHING NEEDS FIXED?</p>
          <h1 className="mt-1 text-[34px] font-extrabold leading-[1.05] tracking-tight text-white">
            We&apos;ll get
            <br />
            <span className="text-[#2f7bff]">you there.</span>
          </h1>
          <p className="mt-2 max-w-[240px] text-sm text-white/70">Find trusted shops for anything mechanical.</p>
          <form action="/mechanics" className="mt-4 space-y-2 rounded-[22px] border border-white/10 bg-[#071422]/80 p-3 backdrop-blur">
            <input type="hidden" name="zip" value={zip || location} />
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/45">
                <Car className="h-3.5 w-3.5 text-[#2f7bff]" /> What are you working on?
              </span>
              <select
                name="vehicle"
                defaultValue={defaultVehicle ? `${defaultVehicle.year} ${defaultVehicle.label.replace(`${defaultVehicle.year} `, "")}` : ""}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0c1d30] px-3 text-sm font-semibold text-white outline-none"
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={`${vehicle.year} ${vehicle.label.replace(`${vehicle.year} `, "")}`}>
                    {vehicle.year} {vehicle.label.replace(`${vehicle.year} `, "")}
                  </option>
                ))}
                {vehicles.length === 0 ? <option value="">Add a vehicle</option> : null}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/45">
                  <Wrench className="h-3.5 w-3.5 text-[#2f7bff]" /> What&apos;s wrong?
                </span>
                <input
                  name="q"
                  placeholder="Front end clunk"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0c1d30] px-3 text-sm text-white outline-none placeholder:text-white/35"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/45">
                  <MapPin className="h-3.5 w-3.5 text-[#2f7bff]" /> Where?
                </span>
                <span className="relative block">
                  <input
                    name="zipDisplay"
                    defaultValue={location}
                    readOnly
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0c1d30] py-0 pl-3 pr-9 text-sm text-white outline-none"
                  />
                  <LocateFixed className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2f7bff]" />
                </span>
              </label>
            </div>
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2f7bff] text-sm font-bold text-white">
              Find the Right Shop
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <div className="px-4">
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const active = item.label === "Auto";
            return (
              <Link key={item.label} href={item.href} className="flex w-[56px] shrink-0 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border",
                    active ? "border-[#2f7bff] bg-[#2f7bff]/15 text-[#7eb0ff]" : "border-white/10 bg-[#0c1d30] text-[#7eb0ff]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={cn("text-center text-[11px] font-semibold", active ? "text-white" : "text-white/70")}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 text-[11px] font-semibold text-white/55">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#2f7bff]" /> Verified Shops
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-[#f5c451]" /> Real Reviews
          </span>
          <span className="inline-flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5 text-[#3ee08f]" /> Secure Booking
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <h2 className="text-lg font-extrabold text-white">Popular near you</h2>
          <Link href="/mechanics" className="text-sm font-semibold text-[#7eb0ff]">
            See All →
          </Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shops.map((shop) => (
            <HomeShopCard key={shop.id} shop={shop} saved={savedShopIds.includes(shop.id)} />
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between">
          <h2 className="text-lg font-extrabold text-white">Your Garage</h2>
          <Link href="/vehicles" className="text-sm font-semibold text-[#7eb0ff]">
            See All →
          </Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href="/vehicles" className="w-[118px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vehicle.photo} alt="" className="h-[86px] w-full rounded-2xl object-cover" />
              <p className="mt-1.5 truncate text-xs font-bold text-white">{vehicle.label}</p>
              <p className="truncate text-[11px] text-white/45">{vehicle.caption}</p>
            </Link>
          ))}
          <Link
            href="/vehicles/new"
            className="flex h-[86px] w-[118px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-[#0c1d30] text-center"
          >
            <Plus className="h-5 w-5 text-[#2f7bff]" />
            <span className="mt-1 text-[11px] font-semibold text-white/70">Add a Vehicle</span>
          </Link>
        </div>

        <h2 className="mt-8 text-lg font-extrabold text-white">Getting it fixed shouldn&apos;t be complicated.</h2>
        <div className="mt-3 grid grid-cols-3 gap-1">
          {STEPS.map((step, index) => (
            <div key={step.n} className="relative px-1 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#2f7bff] text-sm font-extrabold text-white">
                {step.n}
              </span>
              <p className="mt-2 text-[11px] font-bold leading-tight text-white">{step.title}</p>
              <p className="mt-1 text-[10px] leading-tight text-white/50">{step.body}</p>
              {index < STEPS.length - 1 ? (
                <ArrowRight className="absolute -right-1 top-3 h-3.5 w-3.5 text-white/25" />
              ) : null}
            </div>
          ))}
        </div>

        <AppCard className="mt-6 overflow-hidden p-0">
          <div className="relative h-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/lifestyle.png" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[#071422]/45" />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <p className="text-sm font-extrabold uppercase tracking-wide text-white">Real mechanics. Real solutions. Real people.</p>
              <Link href="/how-it-works" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#7eb0ff]">
                Learn More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </AppCard>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Trusted by people who keep life moving.</h2>
            <p className="mt-1 text-sm text-white/50">Real customers. Real repairs. Real experiences.</p>
          </div>
          <Link href="/reviews" className="shrink-0 text-sm font-semibold text-[#7eb0ff]">
            See All Reviews
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {reviews.slice(0, 3).map((review) => (
            <AppCard key={review.id}>
              <div className="flex items-center gap-1 text-[#f5c451]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < review.rating ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5 text-white/15"} />
                ))}
              </div>
              <p className="mt-2 text-sm text-white/80">“{review.body}”</p>
              <p className="mt-2 text-xs font-semibold text-white/45">
                {review.reviewer} · {review.detail}
              </p>
            </AppCard>
          ))}
        </div>

        <Link href="/for-mechanics" className="mt-6 mb-2 flex items-center gap-3 rounded-[22px] border border-white/10 bg-[#0c1d30] p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2f7bff]/15 text-[#2f7bff]">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-white">Are you a shop owner?</span>
            <span className="block text-xs text-white/50">Join Pocket Mechanic and get more of the right work.</span>
          </span>
          <span className="text-sm font-semibold text-[#7eb0ff]">Learn More</span>
        </Link>
      </div>
    </div>
  );
}
