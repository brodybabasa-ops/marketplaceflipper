import Link from "next/link";
import { Camera, Video, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroSearch } from "@/components/marketing/hero-search";
import { APP_NAME, BRAND_TAGLINE, PLATFORM_DISCLAIMER, TAGLINE } from "@/lib/constants";
import { formatCount } from "@/lib/utils";
import { getPublicStats } from "@/services/mechanics";

export default async function LandingPage() {
  const stats = await getPublicStats();
  return (
    <div>
      <section className="relative overflow-hidden bg-navy text-ink">
        <div className="pm-grid absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(10,132,255,0.22),transparent_42%)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{BRAND_TAGLINE}</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl">{TAGLINE}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Tell us what’s happening. Pocket Mechanic helps get it fixed — cars, boats, bikes, RVs, and equipment.
            You don’t need to know what is wrong.
          </p>
          <Card className="mx-auto mt-10 max-w-2xl p-5 text-left">
            <p className="text-sm font-semibold text-ink">What’s going on?</p>
            <HeroSearch />
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" /> Add photos
              </span>
              <span className="inline-flex items-center gap-1">
                <Video className="h-3.5 w-3.5" /> Add video
              </span>
              <span className="inline-flex items-center gap-1">
                <Car className="h-3.5 w-3.5" /> Select vehicle
              </span>
            </div>
          </Card>
          <div className="mt-8 grid grid-cols-2 gap-3 text-left md:grid-cols-4">
            {["Find the right mechanic", "Real reviews", "Know what you’re paying", "Pocket Assurance"].map((item) => (
              <p key={item} className="rounded-xl border border-line bg-card px-3 py-3 text-sm text-muted">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: stats.averageRating.toFixed(1), label: "Average customer rating" },
          { value: formatCount(stats.verifiedJobsCount), label: "Verified jobs" },
          { value: formatCount(stats.mechanicCount), label: "Mechanics" },
          { value: `${stats.statesCovered} states`, label: "Service coverage" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="number text-3xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-bold text-ink">We don’t just list mechanics. We go meet them.</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Pocket Mechanic Verified means an authorized representative personally visited and evaluated the provider. That
          status cannot be purchased.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/fix">Fix It</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/mechanics">Find a mechanic</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/for-mechanics">I’m a mechanic</Link>
          </Button>
        </div>
        <p className="mt-8 text-xs text-muted">{PLATFORM_DISCLAIMER}</p>
        <p className="mt-2 text-xs text-muted">{APP_NAME} does not diagnose vehicles. Independent mechanics do.</p>
        <p className="mt-2 text-xs text-muted">Also for boats, bikes, RVs, and equipment — when you need them.</p>
      </section>
    </div>
  );
}
