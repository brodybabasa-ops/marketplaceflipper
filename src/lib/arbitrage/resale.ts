import type { DealScoreBreakdown } from "@/types/listing";
import { logger } from "@/lib/logger";

/**
 * Arbitrage sources are ones where the listing price is a BUY price (e.g. a
 * Best Buy Open Box offer) and profitability is measured against a resale
 * estimate from another marketplace (e.g. eBay sold comps) — not against
 * sibling listings in our own database.
 */
export const ARBITRAGE_SOURCES = new Set(["bestbuy"]);

export function isArbitrageSource(source: string) {
  return ARBITRAGE_SOURCES.has(source);
}

// eBay final value fee is roughly 13.25% for most categories, plus a per-order
// fixed fee. We keep a conservative flat shipping/packaging buffer on top.
export const RESALE_FEE_RATE = 0.1325;
export const RESALE_FIXED_FEE = 0.4;
export const RESALE_SHIP_BUFFER = 12;

export type ResaleComp = {
  median: number;
  low: number;
  high: number;
  sampleSize: number;
  source: string;
};

export type ResaleQuery = {
  identifier?: string | null;
  title: string;
  category?: string | null;
  referencePrice?: number | null;
};

/**
 * Returns a resale estimate for a product. Uses eBay sold comps when
 * credentials are configured; otherwise falls back to a deterministic mock so
 * the board is fully functional in development.
 */
export async function getResaleComp(query: ResaleQuery): Promise<ResaleComp | null> {
  const live = await ebayResaleComp(query);
  if (live) return live;
  return mockResaleComp(query);
}

async function ebayResaleComp(query: ResaleQuery): Promise<ResaleComp | null> {
  const token = process.env.EBAY_OAUTH_TOKEN;
  if (!token) return null;

  // eBay's sold/completed comps come from the Marketplace Insights API, which
  // requires application approval. Wire the real call here once access is
  // granted; until then we return null so the mock provider is used.
  logger.info("resale.ebay_not_implemented", { identifier: query.identifier ?? null });
  return null;
}

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Deterministic mock resale comps. Keyed off the product identifier so a given
 * SKU always returns the same numbers. Centered on the reference (original)
 * price so some open-box offers clear a profit and some do not.
 */
export function mockResaleComp(query: ResaleQuery): ResaleComp {
  const seed = hash(`${query.identifier ?? query.title}`);
  const base = query.referencePrice && query.referencePrice > 0 ? query.referencePrice : 200;
  // Resale median lands between 82% and 122% of the reference price: some
  // open-box items (hot or discontinued) resell above retail, some sink below.
  const ratio = 0.82 + seed * 0.4;
  const median = Math.max(10, Math.round((base * ratio) / 5) * 5);
  const spread = Math.round(median * (0.08 + seed * 0.07));
  const sampleSize = 3 + Math.floor(seed * 13);
  return {
    median,
    low: Math.max(5, median - spread),
    high: median + spread,
    sampleSize,
    source: "ebay-mock",
  };
}

export function netResale(comp: ResaleComp) {
  return Math.round(comp.median * (1 - RESALE_FEE_RATE) - RESALE_FIXED_FEE - RESALE_SHIP_BUFFER);
}

export type ArbitrageResult = {
  marketPrice: number;
  marketPriceDelta: number | null;
  marketSampleSize: number;
  netProfit: number | null;
  margin: number | null;
  breakdown: DealScoreBreakdown;
};

export function scoreArbitrage(buyPrice: number | null | undefined, comp: ResaleComp): ArbitrageResult {
  const net = netResale(comp);
  const reasons: string[] = [];

  if (buyPrice == null) {
    reasons.push("No buy price on the offer");
    return {
      marketPrice: comp.median,
      marketPriceDelta: null,
      marketSampleSize: comp.sampleSize,
      netProfit: null,
      margin: null,
      breakdown: {
        total: 0,
        price: 0,
        mileage: 0,
        year: 0,
        freshness: 0,
        completeness: 0,
        condition: 0,
        hasMarketData: comp.sampleSize >= 3,
        reasons,
      },
    };
  }

  const netProfit = net - buyPrice;
  const margin = buyPrice > 0 ? netProfit / buyPrice : 0;

  // Margin drives most of the score (0..70).
  let marginScore = 0;
  if (margin >= 0.5) marginScore = 70;
  else if (margin <= -0.1) marginScore = 0;
  else marginScore = Math.round(((margin + 0.1) / 0.6) * 70);
  marginScore = Math.max(0, Math.min(70, marginScore));

  if (margin >= 0.25) reasons.push(`Healthy resale margin (~${Math.round(margin * 100)}%)`);
  else if (margin > 0) reasons.push(`Thin resale margin (~${Math.round(margin * 100)}%)`);
  else reasons.push("Resale comps do not clear a profit after fees");

  // Confidence from number of sold comps (0..20).
  let confidence = Math.min(20, comp.sampleSize * 2);
  if (comp.sampleSize < 3) {
    confidence = 0;
    reasons.push("Not enough sold comps for a reliable estimate");
  } else {
    reasons.push(`${comp.sampleSize} recent sold comps`);
  }

  // Spread tightness (0..10): tighter comp spread = more confidence.
  const spreadRatio = comp.median > 0 ? (comp.high - comp.low) / comp.median : 1;
  const spreadScore = Math.max(0, Math.round(10 - spreadRatio * 40));

  let total = marginScore + confidence + spreadScore;
  if (comp.sampleSize < 3) total = Math.min(total, 40);
  total = Math.max(0, Math.min(100, total));

  return {
    marketPrice: comp.median,
    // Negative delta = profit, matching the rest of the app's convention.
    marketPriceDelta: -netProfit,
    marketSampleSize: comp.sampleSize,
    netProfit,
    margin,
    breakdown: {
      total,
      // Reuse existing breakdown fields so the listing page score bars render.
      price: marginScore,
      mileage: 0,
      year: 0,
      freshness: spreadScore,
      completeness: confidence,
      condition: 0,
      hasMarketData: comp.sampleSize >= 3,
      reasons,
    },
  };
}
