import Link from "next/link";
import { ShieldCheck, ClipboardCheck, MessageSquare, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroSearch } from "@/components/marketing/hero-search";
import { APP_NAME, PLATFORM_DISCLAIMER, SUPPORTING_PHRASE, TAGLINE } from "@/lib/constants";
import { formatCount } from "@/lib/utils";
import { getPublicStats } from "@/services/mechanics";

export default async function LandingPage() {
  const stats = await getPublicStats();
  return (
    <div>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(47,111,237,0.28),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">{SUPPORTING_PHRASE}</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl">{TAGLINE}</h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">
              Connect with verified mechanics, compare real customer ratings, get transparent estimates, and keep your
              entire repair experience in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/mechanics">Find a Mechanic</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/for-mechanics">I'm a Mechanic</Link>
              </Button>
            </div>
          </div>
          <div className="self-end">
            <HeroSearch />
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
            <p className="number text-3xl font-bold text-navy">{stat.value}</p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-3xl font-bold text-navy">Not another directory. An operating system for the repair.</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Go from “I don’t know what’s wrong” to a mechanic you can trust, a written estimate you approved, and a
          digital record of what was done.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Verified mechanics", body: "See verification level, credentials, and real completed jobs." },
            { icon: ClipboardCheck, title: "Transparent estimates", body: "Approve work before it happens. Additional work needs a new yes." },
            { icon: MessageSquare, title: "Job-based messaging", body: "Talk in-app without handing over your phone number first." },
            { icon: FileCheck2, title: "Repair history", body: "Keep a record on the vehicle, not on a paper invoice in the glovebox." },
          ].map((item) => (
            <Card key={item.title} className="p-5">
              <item.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-semibold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <Card className="bg-navy p-8 text-white md:p-12">
          <h2 className="text-3xl font-bold">Ready to find help for your vehicle?</h2>
          <p className="mt-3 max-w-xl text-white/75">
            Start with a year, make, model, and a sentence about what’s going on. We’ll take it from there.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="accent">
              <Link href="/sign-up">Get Started</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </Card>
        <p className="mt-6 text-xs text-muted">{PLATFORM_DISCLAIMER}</p>
        <p className="mt-2 text-xs text-muted">
          {APP_NAME} does not diagnose vehicles. Independent mechanics do.
        </p>
      </section>
    </div>
  );
}
