import { formatPrice, sourceLabel } from "@/lib/utils";

type ListingLike = {
  id: string;
  source: string;
  sourceUrl: string;
  price?: number | null;
  marketPrice?: number | null;
  marketPriceDelta?: number | null;
  marketSampleSize?: number | null;
  dealScore?: number | null;
};

export function isLiveSourceUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.length > 0 && host !== "example.com" && host !== "localhost";
  } catch {
    return false;
  }
}

export function marketplaceCta(listing: Pick<ListingLike, "id" | "source" | "sourceUrl">) {
  const live = isLiveSourceUrl(listing.sourceUrl);
  const facebook = listing.source === "facebook" || listing.source === "mock";
  return {
    label: facebook ? "View on Facebook Marketplace" : `View on ${sourceLabel(listing.source)}`,
    href: live ? listing.sourceUrl : `/go/${listing.id}`,
    external: live,
  };
}

export function marketplaceHomeUrl(source: string) {
  if (source === "ksl") return "https://www.ksl.com/classifieds";
  if (source === "craigslist") return "https://www.craigslist.org/";
  if (source === "offerup") return "https://offerup.com/";
  if (source === "ebay") return "https://www.ebay.com/";
  return "https://www.facebook.com/marketplace/";
}

export function estimatedProfit(listing: Pick<ListingLike, "marketPriceDelta">) {
  if (listing.marketPriceDelta != null && listing.marketPriceDelta < 0) {
    return Math.abs(listing.marketPriceDelta);
  }
  return null;
}

export function profitMargin(
  listing: Pick<ListingLike, "marketPrice" | "marketPriceDelta">,
) {
  const profit = estimatedProfit(listing);
  if (profit == null || listing.marketPrice == null || listing.marketPrice <= 0) return null;
  return profit / listing.marketPrice;
}

export function formatPercent(value: number | null | undefined) {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function dealSnapshot(listing: ListingLike) {
  const profit = estimatedProfit(listing);
  return {
    ask: formatPrice(listing.price),
    market: listing.marketPrice != null ? formatPrice(listing.marketPrice) : "Need more comps",
    profit: profit != null ? `+${formatPrice(profit)}` : "—",
    margin: formatPercent(profitMargin(listing)),
    comps: listing.marketSampleSize ?? 0,
    score: listing.dealScore,
  };
}
