export const SORT_OPTIONS = [
  "newest",
  "oldest",
  "priceLow",
  "priceHigh",
  "mileageLow",
  "yearNewest",
  "dealScore",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export type SellerType = "private" | "dealer" | "unknown";

export type SearchParams = {
  keyword?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  bodyStyle?: string;
  drivetrain?: string;
  transmission?: string;
  fuelType?: string;
  sellerType?: SellerType;
  source?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

export type SearchResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
