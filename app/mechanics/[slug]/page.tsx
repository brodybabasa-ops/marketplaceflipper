import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Rating, Avatar } from "@/components/ui/rating";
import { ReviewCard } from "@/components/jobs/review-card";
import { getMechanicBySlug } from "@/services/mechanics";
import { PRICING_DISCLAIMER, VERIFICATION_LEVELS } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { US_STATES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { searchMechanics } from "@/services/search";
import { shopPhotoFor } from "@/lib/landing";
import { MarketingFooter, MarketingShell } from "@/components/marketing/marketing-shell";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mechanic = await getMechanicBySlug(slug);
  if (mechanic) return { title: mechanic.businessName };
  const state = US_STATES.find((item) => item.slug === slug);
  if (state) return { title: `Mechanics in ${state.name}` };
  const make = await prisma.vehicleMake.findUnique({ where: { slug } });
  if (make) return { title: `${make.name} mechanics` };
  return { title: "Mechanics" };
}

export default async function MechanicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mechanic = await getMechanicBySlug(slug);
  if (mechanic) return <MechanicProfile mechanic={mechanic} />;

  const state = US_STATES.find((item) => item.slug === slug);
  if (state) {
    const { matches } = await searchMechanics({ zip: state.code === "UT" ? "84041" : undefined });
    return (
      <SeoList
        title={`Mechanics in ${state.name}`}
        body={`Verified Pocket Mechanic partners serving ${state.name}. Compare ratings, specialties, and written estimates.`}
        matches={matches}
      />
    );
  }

  const make = await prisma.vehicleMake.findUnique({ where: { slug } });
  if (make) {
    const { matches } = await searchMechanics({ make: make.name, zip: "84041" });
    return (
      <SeoList
        title={`${make.name} mechanics`}
        body={`Find mechanics experienced with ${make.name} vehicles, including diagnostics, brakes, and maintenance.`}
        matches={matches}
      />
    );
  }

  notFound();
}

function SeoList({
  title,
  body,
  matches,
}: {
  title: string;
  body: string;
  matches: Awaited<ReturnType<typeof searchMechanics>>["matches"];
}) {
  return (
    <MarketingShell title={title} subtitle={body} image="/landing/shop-1.png" wide>
      <div className="grid gap-4">
        {matches.map((mechanic) => (
          <MechanicCard key={mechanic.id} mechanic={mechanic} />
        ))}
      </div>
    </MarketingShell>
  );
}

function MechanicProfile({
  mechanic,
}: {
  mechanic: NonNullable<Awaited<ReturnType<typeof getMechanicBySlug>>>;
}) {
  const level = VERIFICATION_LEVELS.find((item) => item.value === mechanic.verificationLevel);
  return (
    <div data-landing className="bg-[#071422] text-white">
      <section className="relative overflow-hidden pb-20 pt-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shopPhotoFor(mechanic.slug)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.88)_0%,rgba(7,20,34,0.55)_55%,rgba(7,20,34,0.25)_100%)]" />
        <div className="relative w-full px-8 lg:px-9">
          <p className="text-xs font-semibold tracking-[0.22em] text-white/75">
            {mechanic.shopCity}, {mechanic.shopState}
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            {mechanic.businessName}
          </h1>
          {mechanic.tagline ? <p className="mt-3 text-lg text-white/75">{mechanic.tagline}</p> : null}
          <p className="font-script mt-4 text-2xl text-white/90">Get it Fixed. Get back out there.</p>
        </div>
      </section>
      <div className="relative z-10 -mt-10 w-full px-3 pb-16 text-navy lg:px-4">
      <div className="rounded-[28px] bg-[#eef2f6] p-6 sm:p-8">
      <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(14,28,47,0.06)] md:flex-row md:items-start">
        <Avatar name={mechanic.businessName} src={mechanic.profilePhotoUrl} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {mechanic.verificationLevel !== "UNVERIFIED" ? (
              <Badge tone="accent" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                {level?.label}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-muted">
            {mechanic.user.firstName} {mechanic.user.lastName}
          </p>
          <div className="mt-2">
            <Rating value={mechanic.averageRating} count={mechanic.reviewCount} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {mechanic.completedJobsCount} verified jobs · {mechanic.shopCity}, {mechanic.shopState} · Serves within{" "}
            {mechanic.serviceRadiusMiles} miles
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/request?mechanic=${mechanic.id}`}>Request Service</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/sign-in`}>Message</Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-navy">About</h2>
        <p className="mt-2 max-w-3xl text-ink">{mechanic.bio}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-navy">Specialties</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {mechanic.makeExpertise.map((item) => (
            <Badge key={item.id} tone="muted">
              {item.make.name}
            </Badge>
          ))}
          {mechanic.specialties.map((item) => (
            <Badge key={item.id} tone="muted">
              {item.category.replaceAll("_", " ").toLowerCase()}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-navy">Certifications</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {mechanic.certifications.filter((item) => item.verified).length === 0 ? (
            <p className="text-sm text-muted">No verified certifications on file yet.</p>
          ) : (
            mechanic.certifications
              .filter((item) => item.verified)
              .map((item) => (
                <Card key={item.id} className="p-4">
                  <p className="font-semibold text-navy">{item.name}</p>
                  <p className="text-sm text-muted">{item.issuer}</p>
                  <Badge tone="accent" className="mt-2">
                    Verified
                  </Badge>
                </Card>
              ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-navy">Pricing</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted">Diagnostic</p>
            <p className="number mt-1 text-2xl font-semibold text-navy">{formatCents(mechanic.diagnosticPriceCents)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Labor</p>
            <p className="number mt-1 text-2xl font-semibold text-navy">{formatCents(mechanic.laborRateCents)}/hour</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Mobile service</p>
            <p className="number mt-1 text-2xl font-semibold text-navy">{formatCents(mechanic.mobileFeeCents)}</p>
          </Card>
        </div>
        <p className="mt-3 text-sm text-muted">{PRICING_DISCLAIMER}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-navy">Reviews</h2>
        <div className="mt-4 grid gap-4">
          {mechanic.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
      </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
