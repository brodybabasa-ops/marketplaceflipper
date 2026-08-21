export const CATEGORIES = [
  "Vehicles",
  "Electronics",
  "Sneakers",
  "Tools",
  "Home & Garden",
  "Sports",
  "Collectibles",
  "Fashion",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type CatalogProduct = {
  category: Category;
  brand: string;
  model: string;
  aliases: string[];
  specs?: string;
  basePrice: number;
};

export const PRODUCT_CATALOG: CatalogProduct[] = [
  { category: "Electronics", brand: "Apple", model: "MacBook Pro 16", aliases: ["macbook pro 16", "macbook pro", "macbook"], specs: "M1 Pro · 16GB · 512GB", basePrice: 980 },
  { category: "Electronics", brand: "Apple", model: "iPhone 15", aliases: ["iphone 15"], specs: "128GB · Unlocked", basePrice: 620 },
  { category: "Electronics", brand: "Apple", model: "iPhone 14 Pro", aliases: ["iphone 14 pro"], specs: "256GB · Unlocked", basePrice: 540 },
  { category: "Electronics", brand: "Sony", model: "PlayStation 5", aliases: ["playstation 5", "ps5"], specs: "Disc edition", basePrice: 380 },
  { category: "Electronics", brand: "Microsoft", model: "Xbox Series X", aliases: ["xbox series x", "series x"], specs: "1TB", basePrice: 360 },
  { category: "Electronics", brand: "Apple", model: "iPad Pro", aliases: ["ipad pro"], specs: "12.9 · 256GB", basePrice: 720 },
  { category: "Electronics", brand: "Apple", model: "AirPods Pro", aliases: ["airpods pro", "airpods"], specs: "USB-C", basePrice: 140 },
  { category: "Electronics", brand: "Samsung", model: "65\" QLED TV", aliases: ["qled", "samsung tv"], specs: "65 inch", basePrice: 450 },
  { category: "Electronics", brand: "Nintendo", model: "Switch OLED", aliases: ["switch oled", "nintendo switch"], specs: "OLED", basePrice: 250 },
  { category: "Sneakers", brand: "Jordan", model: "1 Retro High", aliases: ["jordan 1", "aj1"], specs: "Size 10", basePrice: 180 },
  { category: "Sneakers", brand: "Nike", model: "Dunk Low", aliases: ["dunk low", "nike dunk"], specs: "Size 11", basePrice: 130 },
  { category: "Sneakers", brand: "Adidas", model: "Yeezy 350", aliases: ["yeezy 350", "yeezy", "350 v2"], specs: "Size 10.5", basePrice: 210 },
  { category: "Sneakers", brand: "New Balance", model: "550", aliases: ["nb 550", "new balance 550"], specs: "Size 9", basePrice: 120 },
  { category: "Tools", brand: "DeWalt", model: "20V Drill Kit", aliases: ["dewalt drill", "dewalt"], specs: "2 batteries", basePrice: 160 },
  { category: "Tools", brand: "Milwaukee", model: "M18 Impact", aliases: ["milwaukee m18", "m18", "milwaukee"], specs: "Fuel", basePrice: 190 },
  { category: "Tools", brand: "Makita", model: "Circular Saw", aliases: ["makita saw", "makita"], specs: "18V", basePrice: 140 },
  { category: "Home & Garden", brand: "Dyson", model: "V15 Detect", aliases: ["dyson v15", "dyson"], specs: "Cordless", basePrice: 320 },
  { category: "Home & Garden", brand: "KitchenAid", model: "Stand Mixer", aliases: ["kitchenaid", "stand mixer"], specs: "Artisan", basePrice: 220 },
  { category: "Home & Garden", brand: "Weber", model: "Spirit Grill", aliases: ["weber grill", "weber"], specs: "3-burner", basePrice: 280 },
  { category: "Sports", brand: "Peloton", model: "Bike+", aliases: ["peloton bike", "peloton"], specs: "Bike+", basePrice: 900 },
  { category: "Sports", brand: "Callaway", model: "Rogue Driver", aliases: ["callaway", "rogue driver"], specs: "Stiff", basePrice: 180 },
  { category: "Collectibles", brand: "Pokemon", model: "Vintage Binder", aliases: ["pokemon cards", "pokemon"], specs: "WOTC era", basePrice: 250 },
  { category: "Collectibles", brand: "LEGO", model: "Millennium Falcon", aliases: ["millennium falcon", "lego star wars"], specs: "UCS", basePrice: 420 },
  { category: "Fashion", brand: "The North Face", model: "Nuptse Jacket", aliases: ["nuptse", "north face"], specs: "Men's L", basePrice: 160 },
  { category: "Fashion", brand: "Patagonia", model: "Better Sweater", aliases: ["better sweater", "patagonia"], specs: "Men's M", basePrice: 90 },
];

export function findProduct(text: string): CatalogProduct | null {
  const lower = text.toLowerCase();
  const ranked = [...PRODUCT_CATALOG].sort((a, b) => {
    const aLen = Math.max(...a.aliases.map((alias) => alias.length));
    const bLen = Math.max(...b.aliases.map((alias) => alias.length));
    return bLen - aLen;
  });
  for (const product of ranked) {
    if (product.aliases.some((alias) => lower.includes(alias))) return product;
  }
  return null;
}

export function categoryFromText(text: string): Category | null {
  const product = findProduct(text);
  if (product) return product.category;
  const lower = text.toLowerCase();
  if (/\b(truck|suv|sedan|coupe|vin|mileage|f-?150|camry|wrangler)\b/i.test(lower)) return "Vehicles";
  if (/\b(iphone|macbook|ipad|tv|ps5|xbox|laptop|phone|airpods)\b/i.test(lower)) return "Electronics";
  if (/\b(jordan|sneaker|yeezy|dunk|nike|adidas)\b/i.test(lower)) return "Sneakers";
  if (/\b(dewalt|milwaukee|drill|saw|tool)\b/i.test(lower)) return "Tools";
  if (/\b(dyson|mixer|sofa|furniture|vacuum|grill)\b/i.test(lower)) return "Home & Garden";
  if (/\b(peloton|golf|treadmill|weights)\b/i.test(lower)) return "Sports";
  if (/\b(pokemon|funko|card|comic|collect|lego)\b/i.test(lower)) return "Collectibles";
  if (/\b(jacket|coat|hoodie|dress|nuptse|patagonia)\b/i.test(lower)) return "Fashion";
  return null;
}

export function brandsForCategory(category?: string) {
  if (!category || category === "Vehicles") return [];
  return [...new Set(PRODUCT_CATALOG.filter((item) => item.category === category).map((item) => item.brand))];
}

export function modelsForBrand(category?: string, brand?: string) {
  return PRODUCT_CATALOG.filter(
    (item) => (!category || item.category === category) && (!brand || item.brand === brand),
  ).map((item) => item.model);
}

export function isVehicleCategory(category?: string | null) {
  return !category || category === "Vehicles";
}
