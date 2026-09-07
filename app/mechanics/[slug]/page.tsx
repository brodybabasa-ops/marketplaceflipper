import Link from "next/link";
import { notFound } from "next/navigation";
import { TrustBadges } from "@/components/mechanics/trust-badges";
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
import { getSession } from "@/lib/session";
import { toggleSavedMechanicAction } from "@/app/actions/phase2";
import { addToCompareAction } from "@/app/actions/master";

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
  if (mechanic) {
    const session = await getSession();
    const canSave = session?.role === "CUSTOMER";
    const isSaved =
      canSave && session
        ? Boolean(
            await prisma.savedMechanic.findUnique({
              where: {
                customerId_mechanicProfileId: { customerId: session.id, mechanicProfileId: mechanic.id },
              },
            }),
          )
        : false;
    return (
      <MechanicProfile
        mechanic={mechanic}
        canSave={Boolean(canSave)}
        isSaved={isSaved}
        signedIn={Boolean(session)}
      />
    );
  }

  const state = US_STATES.find((item) => item.slug === slug);
  if (state) {
    const { matches } = await searchMechanics({ zip: state.code === "UT" ? "84101" : undefined });
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
    const { matches } = await searchMechanics({ make: make.name, zip: "84101" });
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-3 max-w-2xl text-muted">{body}</p>
      <div className="mt-8 grid gap-4">
        {matches.map((mechanic) => (
          <MechanicCard key={mechanic.id} mechanic={mechanic} />
        ))}
      </div>
    </div>
  );
}

function MechanicProfile({
  mechanic,
  canSave,
  isSaved,
  signedIn,
}: {
  mechanic: NonNullable<Awaited<ReturnType<typeof getMechanicBySlug>>>;
  canSave: boolean;
  isSaved: boolean;
  signedIn: boolean;
}) {
  const level = VERIFICATION_LEVELS.find((item) => item.value === mechanic.verificationLevel);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-[var(--shadow)] md:flex-row md:items-start">
        <Avatar name={mechanic.businessName} src={mechanic.profilePhotoUrl} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-ink">{mechanic.businessName}</h1>
            <TrustBadges
              verificationLevel={mechanic.verificationLevel}
              lastVerifiedAt={mechanic.lastVerifiedAt}
              isSelect={mechanic.isSelect}
              isFoundingProvider={mechanic.isFoundingProvider}
              foundingNumber={mechanic.foundingNumber}
            />
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
            {canSave ? (
              <form action={toggleSavedMechanicAction}>
                <input type="hidden" name="mechanicProfileId" value={mechanic.id} />
                <Button type="submit" variant={isSaved ? "secondary" : "accent"}>
                  {isSaved ? "Saved" : "Save mechanic"}
                </Button>
              </form>
            ) : null}
            <form action={addToCompareAction}>
              <input type="hidden" name="mechanicProfileId" value={mechanic.id} />
              <Button type="submit" variant="secondary">
                Compare
              </Button>
            </form>
            <Button asChild variant="secondary">
              <Link href={signedIn ? "/messages" : "/sign-in"}>Message</Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-ink">About</h2>
        <p className="mt-2 max-w-3xl text-ink">{mechanic.bio}</p>
        {level ? <p className="mt-3 text-sm text-muted">{level.description}</p> : null}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-ink">Specialties</h2>
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
        <h2 className="text-xl font-semibold text-ink">Certifications</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {mechanic.certifications.filter((item) => item.verified).length === 0 ? (
            <p className="text-sm text-muted">No verified certifications on file yet.</p>
          ) : (
            mechanic.certifications
              .filter((item) => item.verified)
              .map((item) => (
                <Card key={item.id} className="p-4">
                  <p className="font-semibold text-ink">{item.name}</p>
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
        <h2 className="text-xl font-semibold text-ink">Pricing</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted">Diagnostic</p>
            <p className="number mt-1 text-2xl font-semibold text-ink">{formatCents(mechanic.diagnosticPriceCents)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Labor</p>
            <p className="number mt-1 text-2xl font-semibold text-ink">{formatCents(mechanic.laborRateCents)}/hour</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Mobile service</p>
            <p className="number mt-1 text-2xl font-semibold text-ink">{formatCents(mechanic.mobileFeeCents)}</p>
          </Card>
        </div>
        <p className="mt-3 text-sm text-muted">{PRICING_DISCLAIMER}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-ink">Reviews</h2>
        <div className="mt-4 grid gap-4">
          {mechanic.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
}
