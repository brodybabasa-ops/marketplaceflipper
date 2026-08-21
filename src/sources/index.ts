import type { RawListing } from "@/types/listing";
import type { MarketplaceSource } from "@/types/source";
import { SourceNotConfiguredError } from "@/types/source";
import { generateMockListings } from "@/sources/mock/generator";

export const mockMarketplaceSource: MarketplaceSource = {
  name: "mock",
  async searchListings(): Promise<RawListing[]> {
    return generateMockListings();
  },
  async getListing(id: string) {
    const listings = generateMockListings();
    return listings.find((listing) => listing.sourceListingId === id) ?? null;
  },
};

export const facebookMarketplaceSource: MarketplaceSource = {
  name: "facebook",
  async searchListings() {
    throw new SourceNotConfiguredError(
      "facebook",
      "Facebook Marketplace is not connected. Do not scrape, bypass authentication, CAPTCHA, or rate limits. Plug in an authorized provider when available.",
    );
  },
};

const sources: Record<string, MarketplaceSource> = {
  mock: mockMarketplaceSource,
  facebook: facebookMarketplaceSource,
};

export function getSource(name = "mock") {
  const source = sources[name];
  if (!source) throw new Error(`Unknown marketplace source: ${name}`);
  return source;
}

export function listSources() {
  return Object.keys(sources);
}
