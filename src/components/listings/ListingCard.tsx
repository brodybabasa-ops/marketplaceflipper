import type { Listing } from "@prisma/client";
import Link from "next/link";
import { DealBadge } from "@/components/listings/DealBadge";
import { formatLocation, formatMiles, formatPrice, sourceLabel, timeAgo, vehicleTitle } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.imageUrls[0];
  const title = vehicleTitle(listing);
  const belowMarket =
    listing.marketPriceDelta != null && listing.marketPriceDelta < 0
      ? Math.abs(listing.marketPriceDelta)
      : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface">
      <Link href={`/listing/${listing.id}`} className="grid gap-0 sm:grid-cols-[240px_1fr]">
        <div className="relative aspect-[16/10] bg-[#ece7dc] sm:aspect-auto sm:min-h-[180px]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-1 text-sm text-muted">
                {formatMiles(listing.mileage)} · {formatLocation(listing.city, listing.state)}
              </p>
            </div>
            <p className="text-lg font-semibold">{formatPrice(listing.price)}</p>
          </div>
          {listing.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-muted">{listing.description}</p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <DealBadge score={listing.dealScore} />
            {belowMarket ? (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                {formatPrice(belowMarket)} below estimated market
              </span>
            ) : listing.marketSampleSize != null && listing.marketSampleSize < 3 ? (
              <span className="text-xs text-muted">Insufficient market data</span>
            ) : null}
            <span className="text-xs text-muted">{sourceLabel(listing.source)}</span>
            <span className="text-xs text-muted">{timeAgo(listing.firstSeenAt)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
