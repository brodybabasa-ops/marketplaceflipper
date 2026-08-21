import type { Listing } from "@prisma/client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatLocation, formatMiles, formatPrice, timeAgo, vehicleTitle } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.imageUrls[0];
  const title = vehicleTitle(listing);
  const profit =
    listing.marketPriceDelta != null && listing.marketPriceDelta < 0
      ? Math.abs(listing.marketPriceDelta)
      : null;
  const highProfit = (listing.dealScore ?? 0) >= 70;
  const trending = !highProfit && (listing.dealScore ?? 0) >= 55;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/8 bg-surface shadow-[0_10px_40px_-24px_rgba(0,0,0,0.8)]">
      <Link href={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[16/11] bg-[#0d1320]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            {highProfit ? (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-emerald-950">
                High Profit
              </span>
            ) : trending ? (
              <span className="rounded-full bg-violet-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                Trending
              </span>
            ) : null}
          </div>
          <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white">
            <Heart className="h-4 w-4" />
          </span>
        </div>
        <div className="p-4">
          <h2 className="line-clamp-1 text-[15px] font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">
            {[listing.year, listing.normalizedTrim, formatMiles(listing.mileage)].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-lg font-semibold text-profit">{formatPrice(listing.price)}</p>
            {profit ? (
              <p className="text-sm font-medium text-profit">Est. Profit: +{formatPrice(profit)}</p>
            ) : (
              <p className="text-xs text-slate-500">Insufficient market data</p>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {formatLocation(listing.city, listing.state)} · {timeAgo(listing.firstSeenAt)}
            </span>
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
              FB
            </span>
          </div>
          {listing.dealScore != null ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                  style={{ width: `${Math.max(8, listing.dealScore)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-200">{listing.dealScore}</span>
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
