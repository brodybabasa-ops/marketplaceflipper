import { describe, expect, it } from "vitest";
import {
  isArbitrageSource,
  mockResaleComp,
  netResale,
  scoreArbitrage,
} from "@/lib/arbitrage/resale";

describe("arbitrage sources", () => {
  it("flags best buy as an arbitrage source", () => {
    expect(isArbitrageSource("bestbuy")).toBe(true);
    expect(isArbitrageSource("facebook")).toBe(false);
  });
});

describe("mock resale comps", () => {
  it("is deterministic for the same identifier", () => {
    const a = mockResaleComp({ identifier: "6418599-ob-1", title: "PS5", referencePrice: 499 });
    const b = mockResaleComp({ identifier: "6418599-ob-1", title: "PS5", referencePrice: 499 });
    expect(a.median).toBe(b.median);
    expect(a.sampleSize).toBe(b.sampleSize);
    expect(a.low).toBeLessThanOrEqual(a.median);
    expect(a.high).toBeGreaterThanOrEqual(a.median);
  });
});

describe("arbitrage scoring", () => {
  it("rewards a profitable open-box flip after fees", () => {
    const comp = { median: 500, low: 470, high: 530, sampleSize: 10, source: "ebay-mock" };
    const result = scoreArbitrage(300, comp);
    expect(result.netProfit).toBe(netResale(comp) - 300);
    expect(result.netProfit).toBeGreaterThan(0);
    expect(result.marketPriceDelta).toBe(-(result.netProfit as number));
    expect(result.breakdown.total).toBeGreaterThanOrEqual(60);
    expect(result.breakdown.hasMarketData).toBe(true);
  });

  it("does not reward a flip that loses money after fees", () => {
    const comp = { median: 320, low: 300, high: 340, sampleSize: 8, source: "ebay-mock" };
    const result = scoreArbitrage(320, comp);
    expect(result.netProfit).toBeLessThan(0);
    expect(result.breakdown.total).toBeLessThan(40);
  });

  it("caps the score when there are too few comps", () => {
    const comp = { median: 500, low: 480, high: 520, sampleSize: 2, source: "ebay-mock" };
    const result = scoreArbitrage(250, comp);
    expect(result.breakdown.hasMarketData).toBe(false);
    expect(result.breakdown.total).toBeLessThanOrEqual(40);
  });
});
