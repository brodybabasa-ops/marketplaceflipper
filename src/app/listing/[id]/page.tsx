import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DealBadge } from "@/components/listings/DealBadge";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { dealScoreLabel } from "@/lib/scoring/deal-score";
import {
  formatLocation,
  formatMiles,
  formatPrice,
  sourceLabel,
  vehicleTitle,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      priceHistory: { orderBy: { recordedAt: "asc" } },
      duplicateOf: true,
    },
  });
  if (!listing) notFound();

  const session = await getSession();
  const favorited = session
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { userId_listingId: { userId: session.id, listingId: listing.id } },
        }),
      )
    : false;

  const title = vehicleTitle(listing);
  const belowMarket =
    listing.marketPriceDelta != null && listing.marketPriceDelta < 0
      ? Math.abs(listing.marketPriceDelta)
      : null;
  const breakdown = listing.dealScoreBreakdown as {
    reasons?: string[];
    hasMarketData?: boolean;
    price?: number;
    mileage?: number;
    freshness?: number;
    completeness?: number;
  } | null;

  return (
    <AppShell user={session}>
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {listing.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.imageUrls[0]} alt={title} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="aspect-[16/10] bg-[#ece7dc]" />
            )}
            {listing.imageUrls.length > 1 ? (
              <div className="grid grid-cols-4 gap-1 p-1">
                {listing.imageUrls.slice(1, 5).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            <h1 className="text-4xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-muted">
              {formatMiles(listing.mileage)} · {formatLocation(listing.city, listing.state)}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Spec label="Year" value={listing.year} />
            <Spec label="Make" value={listing.normalizedMake} />
            <Spec label="Model" value={listing.normalizedModel} />
            <Spec label="Trim" value={listing.normalizedTrim} />
            <Spec label="Drivetrain" value={listing.drivetrain} />
            <Spec label="Transmission" value={listing.transmission} />
            <Spec label="Fuel" value={listing.fuelType} />
            <Spec label="Body" value={listing.bodyStyle} />
            <Spec label="Engine" value={listing.engine} />
            <Spec label="Condition" value={listing.condition} />
            <Spec label="Seller" value={listing.sellerType} />
            <Spec
              label="Normalized confidence"
              value={
                listing.normalizationConfidence != null
                  ? `${Math.round(listing.normalizationConfidence * 100)}%`
                  : null
              }
            />
          </dl>

          {listing.description ? (
            <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">
                {listing.description}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-3xl font-semibold">{formatPrice(listing.price)}</p>
            <div className="mt-3">
              <DealBadge score={listing.dealScore} />
            </div>
            <p className="mt-3 text-sm text-muted">
              {belowMarket
                ? `${formatPrice(belowMarket)} below estimated market`
                : "Insufficient market data"}
            </p>
            {listing.marketPrice ? (
              <p className="mt-1 text-xs text-muted">
                Estimated comparable market {formatPrice(listing.marketPrice)} ·{" "}
                {listing.marketSampleSize} comps
              </p>
            ) : null}
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-gradient mt-5 flex h-12 items-center justify-center rounded-xl text-sm font-semibold"
            >
              View original listing
            </a>
            <FavoriteButton listingId={listing.id} initial={favorited} />
            <p className="mt-3 text-xs leading-5 text-muted">
              FlipFinder does not host transactions. Contact the seller on {sourceLabel(listing.source)}.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
            <h2 className="font-semibold">Deal score</h2>
            <p className="mt-1 text-muted">
              {listing.dealScore != null
                ? `${listing.dealScore}/100 — ${dealScoreLabel(listing.dealScore)}`
                : "Unscored"}
            </p>
            <ul className="mt-3 space-y-1 text-muted">
              {(breakdown?.reasons ?? []).map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Relative attractiveness versus comparable listings in this catalog. Not a guarantee.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
            <p>Source: {sourceLabel(listing.source)}</p>
            <p>First seen: {listing.firstSeenAt.toLocaleDateString()}</p>
            <p>Last updated: {listing.updatedAt.toLocaleDateString()}</p>
            {listing.duplicateOf.length > 0 ? (
              <p className="mt-2">Possible duplicate flagged ({listing.duplicateOf.length})</p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
    </AppShell>
  );
}

function Spec({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}
