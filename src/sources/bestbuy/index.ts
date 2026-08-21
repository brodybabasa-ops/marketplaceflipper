import type { RawListing } from "@/types/listing";
import type { MarketplaceSource } from "@/types/source";
import { logger } from "@/lib/logger";
import { generateOpenBoxListings } from "@/sources/bestbuy/mock";

// Electronics-heavy Open Box category ids (Best Buy "abcat" category ids).
const OPEN_BOX_CATEGORIES = ["abcat0500000", "abcat0400000", "abcat0300000", "pcmcat209400050001"];

type BestBuyOffer = {
  sku?: number | string;
  names?: { title?: string };
  categoryPath?: Array<{ name?: string }>;
  images?: { standard?: string };
  offers?: Array<{
    type?: string;
    condition?: string;
    prices?: { current?: number; regular?: number };
  }>;
  links?: { web?: string };
};

async function fetchOpenBoxByCategory(apiKey: string, categoryId: string): Promise<RawListing[]> {
  const url = `https://api.bestbuy.com/beta/products/openBox(categoryId=${categoryId})?apiKey=${apiKey}&format=json&pageSize=25`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    logger.warn("bestbuy.category_failed", { categoryId, status: response.status });
    return [];
  }
  const json = (await response.json()) as { results?: BestBuyOffer[] };
  const results = json.results ?? [];
  const listings: RawListing[] = [];

  for (const result of results) {
    const sku = result.sku != null ? String(result.sku) : null;
    const title = result.names?.title;
    if (!sku || !title) continue;
    const category = result.categoryPath?.some((c) => /appliance|kitchen|home/i.test(c.name ?? ""))
      ? "Home & Garden"
      : "Electronics";

    (result.offers ?? []).forEach((offer, index) => {
      const price = offer.prices?.current;
      if (price == null) return;
      listings.push({
        source: "bestbuy",
        sourceListingId: `${sku}-ob-${index + 1}`,
        sourceUrl: result.links?.web ?? `https://www.bestbuy.com/site/searchpage.jsp?st=${sku}`,
        title: `${title}${offer.condition ? ` — ${offer.condition}` : ""}`,
        description: `${title}. Open-box offer via Best Buy Buying Options API. Original price $${offer.prices?.regular ?? ""}.`,
        price,
        condition: offer.condition ?? "Open-Box",
        category,
        sellerType: "dealer",
        sellerName: "Best Buy",
        imageUrls: result.images?.standard ? [result.images.standard] : [],
      });
    });
  }

  return listings;
}

export const bestBuyOpenBoxSource: MarketplaceSource = {
  name: "bestbuy",
  async searchListings(): Promise<RawListing[]> {
    const apiKey = process.env.BESTBUY_API_KEY;
    if (!apiKey) {
      logger.info("bestbuy.using_mock", { reason: "BESTBUY_API_KEY not set" });
      return generateOpenBoxListings();
    }

    try {
      const batches = await Promise.all(
        OPEN_BOX_CATEGORIES.map((categoryId) => fetchOpenBoxByCategory(apiKey, categoryId)),
      );
      const listings = batches.flat();
      if (listings.length === 0) {
        logger.warn("bestbuy.empty_live_results_using_mock");
        return generateOpenBoxListings();
      }
      return listings;
    } catch (error) {
      logger.error("bestbuy.live_fetch_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return generateOpenBoxListings();
    }
  },
};
