import type { RawListing } from "@/types/listing";

type OpenBoxSeed = {
  sku: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  msrp: number;
  image: string;
};

const CATALOG: OpenBoxSeed[] = [
  { sku: "6565837", title: "Apple - MacBook Air 13.6\" Laptop M3", brand: "Apple", model: "MacBook Air M3", category: "Electronics", msrp: 1099, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6418599", title: "Sony - PlayStation 5 Console", brand: "Sony", model: "PlayStation 5", category: "Electronics", msrp: 499, image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6535538", title: "Microsoft - Xbox Series X 1TB Console", brand: "Microsoft", model: "Xbox Series X", category: "Electronics", msrp: 499, image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6509650", title: "Samsung - 65\" Class QLED 4K Smart TV", brand: "Samsung", model: "65\" QLED 4K", category: "Electronics", msrp: 799, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6487445", title: "Dyson - V15 Detect Cordless Vacuum", brand: "Dyson", model: "V15 Detect", category: "Home & Garden", msrp: 749, image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6535590", title: "Apple - AirPods Pro (2nd generation) USB-C", brand: "Apple", model: "AirPods Pro 2", category: "Electronics", msrp: 249, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6473301", title: "Bose - QuietComfort Ultra Headphones", brand: "Bose", model: "QC Ultra", category: "Electronics", msrp: 429, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6501704", title: "LG - 27\" UltraGear QHD Gaming Monitor", brand: "LG", model: "27GP850 UltraGear", category: "Electronics", msrp: 449, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6447466", title: "KitchenAid - Artisan Series 5 Qt Stand Mixer", brand: "KitchenAid", model: "Artisan Stand Mixer", category: "Home & Garden", msrp: 449, image: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6565248", title: "GoPro - HERO12 Black Action Camera", brand: "GoPro", model: "HERO12 Black", category: "Electronics", msrp: 399, image: "https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6505727", title: "DJI - Mini 3 Drone", brand: "DJI", model: "Mini 3", category: "Electronics", msrp: 559, image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80" },
  { sku: "6509440", title: "Nintendo - Switch OLED Model", brand: "Nintendo", model: "Switch OLED", category: "Electronics", msrp: 349, image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1200&q=80" },
];

const STORES = [
  { city: "Salt Lake City", state: "UT", zipCode: "84101", latitude: 40.7608, longitude: -111.891 },
  { city: "Denver", state: "CO", zipCode: "80202", latitude: 39.7392, longitude: -104.9903 },
  { city: "Phoenix", state: "AZ", zipCode: "85004", latitude: 33.4484, longitude: -112.074 },
  { city: "Dallas", state: "TX", zipCode: "75201", latitude: 32.7767, longitude: -96.797 },
  { city: "Seattle", state: "WA", zipCode: "98101", latitude: 47.6062, longitude: -122.3321 },
];

const CONDITIONS = [
  { label: "Open-Box Excellent", discount: 0.15 },
  { label: "Open-Box Certified", discount: 0.1 },
  { label: "Open-Box Satisfactory", discount: 0.28 },
];

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Deterministic mock of Best Buy Open Box "Buying Options" offers. Each SKU
 * yields a couple of open-box offers at different conditions/stores, priced
 * below the item's MSRP, mirroring the real Open Box API shape.
 */
export function generateOpenBoxListings(): RawListing[] {
  const listings: RawListing[] = [];

  CATALOG.forEach((item, index) => {
    const offerCount = 1 + Math.floor(seededRandom(index + 1) * 2);
    for (let i = 0; i < offerCount; i += 1) {
      const r = seededRandom(index * 10 + i + 1);
      const condition = CONDITIONS[(index + i) % CONDITIONS.length]!;
      const store = STORES[(index + i) % STORES.length]!;
      const jitter = 0.96 + r * 0.08;
      const openBoxPrice = Math.round((item.msrp * (1 - condition.discount) * jitter) / 5) * 5;
      const listingId = `${item.sku}-ob-${i + 1}`;

      listings.push({
        source: "bestbuy",
        sourceListingId: listingId,
        sourceUrl: `https://www.bestbuy.com/site/searchpage.jsp?st=${item.sku}`,
        title: `${item.title} — ${condition.label}`,
        description: `${item.title}. ${condition.label} open-box unit, ships from the ${store.city} Best Buy. Original price $${item.msrp}. Condition graded by Best Buy.`,
        price: openBoxPrice,
        make: item.brand,
        model: item.model,
        condition: condition.label,
        category: item.category,
        city: store.city,
        state: store.state,
        zipCode: store.zipCode,
        latitude: store.latitude,
        longitude: store.longitude,
        sellerType: "dealer",
        sellerName: "Best Buy",
        imageUrls: [item.image],
        listedAt: new Date(Date.now() - Math.floor(r * 72) * 3600000),
      });
    }
  });

  return listings;
}

export function openBoxReferencePrice(sourceListingId: string): number | null {
  const sku = sourceListingId.split("-")[0];
  const item = CATALOG.find((entry) => entry.sku === sku);
  return item?.msrp ?? null;
}
