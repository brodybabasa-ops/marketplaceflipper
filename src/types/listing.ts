export type ListingStatus = "active" | "sold" | "expired" | "removed";

export type RawListing = {
  source: string;
  sourceListingId: string;
  sourceUrl: string;
  title: string;
  description?: string | null;
  price?: number | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  mileage?: number | null;
  condition?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sellerType?: "private" | "dealer" | "unknown";
  sellerName?: string | null;
  imageUrls?: string[];
  vin?: string | null;
  listedAt?: Date | string | null;
  category?: string | null;
};

export type NormalizedVehicle = {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  mileage: number | null;
  engine: string | null;
  drivetrain: string | null;
  transmission: string | null;
  fuelType: string | null;
  bodyStyle: string | null;
  condition: string | null;
  category: string | null;
  confidence: number;
};

export type DealScoreBreakdown = {
  total: number;
  price: number;
  mileage: number;
  year: number;
  freshness: number;
  completeness: number;
  condition: number;
  hasMarketData: boolean;
  reasons: string[];
};

export type MarketEstimate = {
  marketPrice: number | null;
  delta: number | null;
  sampleSize: number;
  label: string;
};
