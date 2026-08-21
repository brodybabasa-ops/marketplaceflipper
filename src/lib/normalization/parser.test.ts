import { describe, expect, it } from "vitest";
import { parseVehicleText } from "@/lib/normalization/parser";
import { parseNaturalQuery } from "@/lib/search/params";
import { dealScoreLabel, scoreDeal } from "@/lib/scoring/deal-score";

describe("parseVehicleText", () => {
  it("normalizes a messy Super Duty title without inventing mileage", () => {
    const result = parseVehicleText("2018 F250 Lariat 6.7 Diesel 4x4 low miles");
    expect(result.year).toBe(2018);
    expect(result.make).toBe("Ford");
    expect(result.model).toBe("F-250");
    expect(result.trim).toBe("Lariat");
    expect(result.drivetrain).toBe("4WD");
    expect(result.fuelType).toBe("Diesel");
    expect(result.engine).toBe("6.7L Power Stroke");
    expect(result.mileage).toBeNull();
    expect(result.bodyStyle).toBe("Pickup");
    expect(result.category).toBe("Vehicles");
  });

  it("returns null rather than guessing unknown fields", () => {
    const result = parseVehicleText("Red truck for sale cheap");
    expect(result.make).toBeNull();
    expect(result.model).toBeNull();
    expect(result.year).toBeNull();
    expect(result.mileage).toBeNull();
  });

  it("normalizes a Marketplace product without forcing vehicle fields", () => {
    const result = parseVehicleText("MacBook Pro 16 M1 512GB need gone");
    expect(result.category).toBe("Electronics");
    expect(result.make).toBe("Apple");
    expect(result.model).toBe("MacBook Pro 16");
    expect(result.mileage).toBeNull();
    expect(result.drivetrain).toBeNull();
  });
});

describe("parseNaturalQuery", () => {
  it("parses a year range, make, model, and price cap", () => {
    const result = parseNaturalQuery("2018-2022 Ford F-250 under $40k");
    expect(result.yearMin).toBe(2018);
    expect(result.yearMax).toBe(2022);
    expect(result.make).toBe("Ford");
    expect(result.model).toBe("F-250");
    expect(result.priceMax).toBe(40000);
    expect(result.category).toBe("Vehicles");
  });

  it("parses a non-vehicle product query", () => {
    const result = parseNaturalQuery("iPhone 15 under $500");
    expect(result.category).toBe("Electronics");
    expect(result.make).toBe("Apple");
    expect(result.model).toBe("iPhone 15");
    expect(result.priceMax).toBe(500);
  });
});

describe("deal scoring", () => {
  it("caps scores when comparable market data is missing", () => {
    const listing = {
      price: 20000,
      mileage: 80000,
      year: 2019,
      trim: "XLT",
      normalizedMake: "Ford",
      normalizedModel: "F-150",
      normalizedTrim: "XLT",
      imageUrls: ["x"],
      city: "Layton",
      description: "Clean title",
      firstSeenAt: new Date(),
      condition: "Good",
      drivetrain: "4WD",
      engine: "5.0L V8",
      category: "Vehicles",
      title: "2019 Ford F-150 XLT",
    };
    const breakdown = scoreDeal(listing, []);
    expect(breakdown.hasMarketData).toBe(false);
    expect(breakdown.total).toBeLessThanOrEqual(55);
    expect(dealScoreLabel(breakdown.total)).toBe("Average");
  });

  it("rewards below-market pricing when comparables exist", () => {
    const listing = {
      price: 28000,
      mileage: 70000,
      year: 2020,
      trim: "Lariat",
      normalizedMake: "Ford",
      normalizedModel: "F-250",
      normalizedTrim: "Lariat",
      imageUrls: ["x"],
      city: "Layton",
      description: "Clean title one owner",
      firstSeenAt: new Date(),
      condition: "Excellent",
      drivetrain: "4WD",
      engine: "6.7L Power Stroke",
      category: "Vehicles",
      title: "2020 Ford F-250 Lariat",
    };
    const comps = [32000, 34000, 36000, 35000].map((price, index) => ({
      ...listing,
      price,
      mileage: 72000 + index * 1000,
    }));
    const breakdown = scoreDeal(listing, comps);
    expect(breakdown.hasMarketData).toBe(true);
    expect(breakdown.total).toBeGreaterThanOrEqual(70);
    expect(dealScoreLabel(breakdown.total)).toMatch(/Deal/);
  });

  it("scores non-vehicle listings from comparables without mileage", () => {
    const listing = {
      price: 400,
      mileage: null,
      year: null,
      trim: "128GB · Unlocked",
      normalizedMake: "Apple",
      normalizedModel: "iPhone 15",
      normalizedTrim: "128GB · Unlocked",
      imageUrls: ["x"],
      city: "Provo",
      description: "Like new unlocked",
      firstSeenAt: new Date(),
      condition: "Like new",
      drivetrain: null,
      engine: null,
      category: "Electronics",
      title: "iPhone 15 128GB Unlocked",
    };
    const comps = [520, 540, 560, 550].map((price) => ({ ...listing, price }));
    const breakdown = scoreDeal(listing, comps);
    expect(breakdown.hasMarketData).toBe(true);
    expect(breakdown.total).toBeGreaterThanOrEqual(70);
  });
});
