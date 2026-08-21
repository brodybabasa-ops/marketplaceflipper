import { describe, expect, it } from "vitest";
import {
  dealSnapshot,
  estimatedProfit,
  isLiveSourceUrl,
  marketplaceCta,
  profitMargin,
} from "@/lib/marketplace";

describe("marketplace click-through", () => {
  it("keeps sample listings on FlipFinder until the user continues out", () => {
    const cta = marketplaceCta({
      id: "abc",
      source: "facebook",
      sourceUrl: "https://example.com/listings/mock-001",
    });
    expect(cta.href).toBe("/go/abc");
    expect(cta.external).toBe(false);
    expect(cta.label).toBe("View on Facebook Marketplace");
  });

  it("opens a live Marketplace URL in a new tab", () => {
    const cta = marketplaceCta({
      id: "abc",
      source: "facebook",
      sourceUrl: "https://www.facebook.com/marketplace/item/123",
    });
    expect(cta.href).toBe("https://www.facebook.com/marketplace/item/123");
    expect(cta.external).toBe(true);
  });
});

describe("deal snapshot", () => {
  it("computes estimated profit and margin from comps", () => {
    const listing = {
      id: "abc",
      source: "facebook",
      sourceUrl: "https://example.com/x",
      price: 400,
      marketPrice: 520,
      marketPriceDelta: -120,
      marketSampleSize: 6,
      dealScore: 82,
    };
    expect(estimatedProfit(listing)).toBe(120);
    expect(profitMargin(listing)).toBeCloseTo(120 / 520);
    const snapshot = dealSnapshot(listing);
    expect(snapshot.profit).toBe("+$120");
    expect(snapshot.margin).toBe("23%");
    expect(snapshot.comps).toBe(6);
  });

  it("does not invent profit without market data", () => {
    const listing = {
      id: "abc",
      source: "facebook",
      sourceUrl: "https://example.com/x",
      price: 400,
      marketPrice: null,
      marketPriceDelta: null,
      marketSampleSize: 1,
      dealScore: 40,
    };
    expect(estimatedProfit(listing)).toBeNull();
    expect(dealSnapshot(listing).market).toBe("Need more comps");
  });
});

describe("live source urls", () => {
  it("rejects example.com placeholders", () => {
    expect(isLiveSourceUrl("https://example.com/listings/mock-001")).toBe(false);
    expect(isLiveSourceUrl("https://www.facebook.com/marketplace/item/1")).toBe(true);
  });
});
