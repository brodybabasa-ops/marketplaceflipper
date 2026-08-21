import { SourceNotConfiguredError } from "@/types/source";
import type { MarketplaceSource } from "@/types/source";

export const facebookMarketplaceSource: MarketplaceSource = {
  name: "facebook",
  async searchListings() {
    throw new SourceNotConfiguredError(
      "facebook",
      "Facebook Marketplace is not connected. Use an authorized data provider. Do not scrape or bypass access controls.",
    );
  },
};
