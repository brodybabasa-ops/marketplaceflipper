import type { RawListing } from "@/types/listing";
import type { SearchParams } from "@/types/search";

export interface MarketplaceSource {
  name: string;
  searchListings(params: SearchParams): Promise<RawListing[]>;
  getListing?(id: string): Promise<RawListing | null>;
}

export class SourceNotConfiguredError extends Error {
  constructor(source: string, message?: string) {
    super(
      message ??
        `${source} is not connected. Connect an authorized data provider before ingesting from this source.`,
    );
    this.name = "SourceNotConfiguredError";
  }
}
