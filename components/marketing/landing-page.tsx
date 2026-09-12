import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { HeroSearch } from "@/components/marketing/hero-search";
import { LandingPhone } from "@/components/marketing/landing-phone";
import { Logo } from "@/components/layout/logo";
import { LANDING_CATEGORIES } from "@/lib/landing";
import { PLATFORM_DISCLAIMER } from "@/lib/constants";
import { StoreBadges } from "@/components/marketing/marketing-shell";
import type { FeaturedShop, LandingReview } from "@/services/landing";

export function LandingPage({ shops, reviews }: { shops: FeaturedShop[]; reviews: LandingReview[] }) {
  return (
    <div data-landing className="bg-[#071422] text-white">
      <Hero />
      <HowItWorks />
      <FeaturedShops shops={shops} />
      <Reviews reviews={reviews} />
      <LandingFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-24 sm:pt-28">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/hero-truck.png"
        alt="Pickup truck on a mountain road at sunset"
        className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.94)_0%,rgba(7,20,34,0.78)_38%,rgba(7,20,34,0.28)_68%,rgba(7,20,34,0.18)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,34,0.35)_0%,transparent_22%,transparent_72%,rgba(7,20,34,0.88)_100%)]" />

      <div className="relative w-full px-4 lg:px-6">
        <div className="max-w-xl pt-4">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
            Something
            <br />
            needs fixed?
            <br />
            <span className="text-[#2f7bff]">We&apos;ll get you there.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-white/75 sm:text-lg">
            Find trusted, verified shops for cars, trucks, boats, RVs, motorcycles, and more. All in one place.
          </p>
          <p className="font-script mt-4 text-2xl text-white/90">Get it Fixed. Get back out there.</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/80">
            <TrustChip icon={ShieldCheck} label="Verified Shops" />
            <TrustChip icon={Star} label="Real Reviews" />
            <TrustChip icon={CalendarCheck} label="Book Appointments" />
            <TrustChip icon={ClipboardList} label="Get Estimates" />
            <TrustChip icon={MapPin} label="Drive Forward" />
          </div>
        </div>

        <div className="relative mt-10">
          <HeroSearch />
        </div>

        <div id="vehicles" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {LANDING_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={category.href}
              className="group relative overflow-hidden rounded-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={category.image} alt="" className="h-28 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-32" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute inset-x-0 bottom-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                {category.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustChip({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-[#2f7bff]" />
      {label}
    </span>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-16 sm:py-20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/hero-truck.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_30%] opacity-60" />
      <div className="absolute inset-0 bg-[#071422]/80" />
      <div className="relative w-full px-4 lg:px-6">
        <div className="max-w-xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            A better way
            <br />
            to find a <span className="text-[#2f7bff]">mechanic.</span>
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            No more guessing. Pocket Mechanic connects you with trusted, verified shops that specialize in your exact
            repair — so you can get back to what you love.
          </p>
          <p className="font-script mt-4 text-2xl text-white/85">Same Roads. Different Machines. Same Solution.</p>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Search,
              title: "Find the Right Shop",
              body: "Shops that match your vehicle and repair needs.",
            },
            {
              icon: BadgeCheck,
              title: "Verified & Reviewed",
              body: "Real customers. Real experiences.",
            },
            {
              icon: CalendarCheck,
              title: "Book with Confidence",
              body: "See availability, request appointments, and get estimates — all in one place.",
            },
            {
              icon: Wrench,
              title: "All Things Mechanical",
              body: "Cars, trucks, boats, RVs, powersports, and more.",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-7 w-7 text-[#2f7bff]" />
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-white/65">{item.body}</p>
            </div>
          ))}
        </div>
        <Link
          href="/sign-up"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#2f7bff] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2568e8]"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function FeaturedShops({ shops }: { shops: FeaturedShop[] }) {
  return (
    <section className="bg-[#e8eef4] py-16 text-navy sm:py-20">
      <div className="relative w-full px-4 lg:px-6">
        <div className="flex items-end justify-between gap-4 lg:pr-[300px]">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Featured Shops Near You</h2>
            <Link href="/mechanics?zip=84041" className="hidden items-center gap-1 text-sm font-semibold text-[#2f7bff] sm:inline-flex">
              View All Shops
              <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
          {shops.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {shops.map((shop) => (
                <article key={shop.slug} className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
                  <div className="relative h-36 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shop.photo} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-navy">{shop.businessName}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-navy">{shop.averageRating.toFixed(1)}</span>
                      <span>({shop.reviewCount} reviews)</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {shop.distanceLabel}
                      {shop.distanceLabel ? " · " : ""}
                      {shop.city}, {shop.state}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {shop.specialties.map((item) => (
                        <span key={item} className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-navy">
                          {item}
                        </span>
                      ))}
                      {shop.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-success">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      Earliest Availability
                      <br />
                      <span className="font-semibold text-navy">{shop.availabilityLabel}</span>
                    </p>
                    <Link
                      href={`/mechanics/${shop.slug}`}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#2f7bff] text-sm font-semibold text-[#2f7bff] hover:bg-[#2f7bff] hover:text-white"
                    >
                      View Shop
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-muted">Shops will appear here after the directory is seeded for this area.</p>
          )}
          <Link href="/mechanics?zip=84041" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#2f7bff] sm:hidden">
            View All Shops
            <ArrowRight className="h-4 w-4" />
          </Link>
          </div>
        <div className="text-center lg:-mt-28 lg:text-left">
          <LandingPhone shops={shops} />
          <h3 className="mt-6 text-3xl font-extrabold leading-tight text-navy">
            Find.
            <br />
            Book.
            <br />
            Get it Fixed.
          </h3>
          <p className="mt-3 text-sm text-muted">
            Pocket Mechanic makes it easy to find trusted shops, compare options, book appointments, and stay in the loop.
          </p>
          <div className="mt-5 flex flex-col items-center gap-2 lg:items-start">
            <StoreBadges />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

function Reviews({ reviews }: { reviews: LandingReview[] }) {
  return (
    <section className="relative overflow-hidden bg-[#071422] py-16 sm:py-20">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/lifestyle.png" alt="Person and dog watching a mountain sunset" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071422] via-[#071422]/40 to-transparent" />
        <p className="font-script absolute bottom-16 right-10 max-w-[160px] text-right text-3xl leading-tight text-white">
          More Time
          <br />
          Out Here.
        </p>
      </div>
      <div className="relative w-full px-4 lg:px-6">
        <div className="flex items-end justify-between gap-4 lg:max-w-[58%]">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Real People. Real Repairs.</h2>
          <Link href="/mechanics" className="hidden items-center gap-1 text-sm font-semibold text-[#2f7bff] sm:inline-flex">
            See More Reviews
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:max-w-[58%]">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl bg-[#102033] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f7bff] text-sm font-bold">
                  {review.reviewer.charAt(0)}
                </span>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : "text-white/20"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/85">“{review.body}”</p>
              <p className="mt-4 text-sm font-semibold">{review.reviewer}</p>
              <p className="text-xs text-white/50">{review.detail}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 overflow-hidden rounded-2xl lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/lifestyle.png" alt="Person and dog watching a mountain sunset" className="h-56 w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#071422]">
      <div className="flex w-full flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <Logo light stacked />
          <p className="mt-3 text-sm text-white/60">Anything Mechanical. Anywhere.</p>
        </div>
        <div className="max-w-xl text-center sm:text-left">
          <p className="text-2xl font-bold">Ready to get started?</p>
          <p className="mt-1 text-sm text-white/60">Join thousands of people who trust Pocket Mechanic to keep them moving.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2f7bff] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2568e8]"
          >
            Get the App
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/for-mechanics"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
          >
            For Shops
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="w-full px-4 pb-8 text-xs leading-5 text-white/40 lg:px-6">
        <p>{PLATFORM_DISCLAIMER}</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/dispute-policy">Dispute Policy</Link>
          <Link href="/legal/review-policy">Review Policy</Link>
        </div>
      </div>
    </footer>
  );
}
