import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rating, Avatar } from "@/components/ui/rating";
import { formatCents } from "@/lib/money";
import { formatDistance } from "@/lib/geo";
import { responseTimeLabel } from "@/services/matching";
import type { MechanicMatch } from "@/services/matching";
import { shopPhotoFor } from "@/lib/landing";
import { ShieldCheck } from "lucide-react";

export function MechanicCard({ mechanic, href }: { mechanic: MechanicMatch; href?: string }) {
  const profileHref = href ?? `/mechanics/${mechanic.slug}`;
  const verified = mechanic.verificationLevel !== "UNVERIFIED";
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shopPhotoFor(mechanic.slug)} alt="" className="h-36 w-full object-cover" />
      <div className="p-5">
      <div className="flex gap-4">
        <Avatar name={mechanic.businessName} src={mechanic.profilePhotoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-navy">{mechanic.businessName}</h3>
            {verified ? (
              <Badge tone="accent" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            ) : null}
            {mechanic.serviceMode !== "SHOP" ? <Badge tone="muted">Mobile mechanic</Badge> : null}
            {mechanic.isSponsored ? <Badge tone="warning">Sponsored</Badge> : null}
          </div>
          <p className="text-sm text-muted">
            {mechanic.firstName} {mechanic.lastName}
          </p>
          <div className="mt-2">
            <Rating value={mechanic.averageRating} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {mechanic.completedJobsCount.toLocaleString()} Pocket Mechanic jobs · {formatDistance(mechanic.distanceMiles)}
          </p>
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
          <p className="number text-xl font-semibold text-navy">{formatCents(mechanic.startingPriceCents, { from: true })}</p>
          <p className="text-sm text-muted">{responseTimeLabel(mechanic.avgResponseMinutes)}</p>
        </div>
        <Button asChild>
          <Link href={profileHref}>View Profile</Link>
        </Button>
      </div>
      </div>
    </article>
  );
}
