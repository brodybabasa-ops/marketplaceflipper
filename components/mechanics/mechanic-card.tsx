import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rating, Avatar } from "@/components/ui/rating";
import { formatCents } from "@/lib/money";
import { formatDistance } from "@/lib/geo";
import { responseTimeLabel } from "@/services/matching";
import type { MechanicMatch } from "@/services/matching";
import { addToCompareAction } from "@/app/actions/master";
import { TrustBadges } from "@/components/mechanics/trust-badges";

export function MechanicCard({ mechanic, href }: { mechanic: MechanicMatch; href?: string }) {
  const profileHref = href ?? `/mechanics/${mechanic.slug}`;
  return (
    <article className="rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow)]">
      <div className="flex gap-4">
        <Avatar name={mechanic.businessName} src={mechanic.profilePhotoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-ink">{mechanic.businessName}</h3>
            <TrustBadges
              verificationLevel={mechanic.verificationLevel}
              lastVerifiedAt={mechanic.lastVerifiedAt}
              isSelect={mechanic.isSelect}
              isFoundingProvider={mechanic.isFoundingProvider}
              foundingNumber={mechanic.foundingNumber}
              verifiedIndustries={mechanic.verifiedIndustryKeys.map((key) =>
                key
                  .toLowerCase()
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" "),
              )}
            />
            {mechanic.serviceMode !== "SHOP" ? <Badge tone="muted">Mobile mechanic</Badge> : null}
            {mechanic.industryKeys.filter((key) => key !== "AUTOMOTIVE").map((key) => (
              <Badge key={key} tone="muted">
                {key.replaceAll("_", " ").toLowerCase()}
              </Badge>
            ))}
            {mechanic.isSponsored ? <Badge tone="warning">Sponsored</Badge> : null}
          </div>
          <p className="text-sm text-muted">
            {mechanic.firstName} {mechanic.lastName}
          </p>
          <div className="mt-2">
            <Rating value={mechanic.averageRating} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {mechanic.completedJobsCount.toLocaleString()} verified Pocket Mechanic jobs · {formatDistance(mechanic.distanceMiles)}
          </p>
          {mechanic.reasons.length ? (
            <p className="mt-2 text-xs text-muted">{mechanic.reasons.join(" · ")}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {mechanic.makeNames.slice(0, 4).map((make) => (
          <Badge key={make} tone="muted">
            {make}
          </Badge>
        ))}
        {mechanic.specialties.slice(0, 3).map((item) => (
          <Badge key={item} tone="muted">
            {item.replaceAll("_", " ").toLowerCase()}
          </Badge>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="number text-xl font-semibold text-ink">{formatCents(mechanic.startingPriceCents, { from: true })}</p>
          <p className="text-sm text-muted">{responseTimeLabel(mechanic.avgResponseMinutes)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={profileHref}>View Profile</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/intake?mechanic=${mechanic.id}`}>Request Service</Link>
          </Button>
          <form action={addToCompareAction}>
            <input type="hidden" name="mechanicProfileId" value={mechanic.id} />
            <Button type="submit" variant="secondary">
              Compare
            </Button>
          </form>
        </div>
      </div>
    </article>
  );
}
