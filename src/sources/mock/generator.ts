import type { RawListing } from "@/types/listing";
import { VEHICLE_CATALOG } from "@/lib/normalization/catalog";

type City = {
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
};

const CITIES: City[] = [
  { city: "Salt Lake City", state: "UT", zipCode: "84101", latitude: 40.7608, longitude: -111.891 },
  { city: "Layton", state: "UT", zipCode: "84041", latitude: 41.0602, longitude: -111.971 },
  { city: "Provo", state: "UT", zipCode: "84601", latitude: 40.2338, longitude: -111.6585 },
  { city: "Ogden", state: "UT", zipCode: "84401", latitude: 41.223, longitude: -111.9738 },
  { city: "Park City", state: "UT", zipCode: "84060", latitude: 40.6461, longitude: -111.498 },
  { city: "Denver", state: "CO", zipCode: "80202", latitude: 39.7392, longitude: -104.9903 },
  { city: "Boise", state: "ID", zipCode: "83702", latitude: 43.615, longitude: -116.2023 },
  { city: "Phoenix", state: "AZ", zipCode: "85004", latitude: 33.4484, longitude: -112.074 },
  { city: "Las Vegas", state: "NV", zipCode: "89101", latitude: 36.1699, longitude: -115.1398 },
  { city: "Dallas", state: "TX", zipCode: "75201", latitude: 32.7767, longitude: -96.797 },
  { city: "Austin", state: "TX", zipCode: "78701", latitude: 30.2672, longitude: -97.7431 },
  { city: "Portland", state: "OR", zipCode: "97201", latitude: 45.5152, longitude: -122.6784 },
  { city: "Seattle", state: "WA", zipCode: "98101", latitude: 47.6062, longitude: -122.3321 },
  { city: "Los Angeles", state: "CA", zipCode: "90012", latitude: 34.0522, longitude: -118.2437 },
  { city: "San Diego", state: "CA", zipCode: "92101", latitude: 32.7157, longitude: -117.1611 },
];

const IMAGES: Record<string, string[]> = {
  Pickup: [
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  ],
  SUV: [
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  ],
  Sedan: [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80",
  ],
  Coupe: [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  ],
  Wagon: [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80",
  ],
  Convertible: [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80",
  ],
};

const SELLERS = [
  { type: "private" as const, name: "Alex M." },
  { type: "private" as const, name: "Jordan P." },
  { type: "private" as const, name: "Sam K." },
  { type: "dealer" as const, name: "Wasatch Auto Group" },
  { type: "dealer" as const, name: "High Desert Motors" },
  { type: "dealer" as const, name: "Canyon Rim Trucks" },
];

const CONDITIONS = ["Clean title", "Excellent", "Good", "One owner", "Needs work"];

function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]) {
  return items[Math.floor(rng() * items.length)]!;
}

function between(rng: () => number, min: number, max: number) {
  return Math.floor(min + rng() * (max - min + 1));
}

function basePrice(make: string, model: string, year: number, mileage: number) {
  const age = Math.max(0, 2026 - year);
  let price = 28000;
  if (make === "Porsche") price = 98000;
  else if (make === "BMW") price = 42000;
  else if (model.includes("F-250") || model.includes("2500") || model.includes("3500")) price = 48000;
  else if (model.includes("F-150") || model.includes("Silverado") || model.includes("Sierra") || model === "1500" || model === "Tundra") price = 36000;
  else if (model === "Tacoma" || model === "4Runner" || model === "Wrangler" || model === "Bronco") price = 34000;
  else if (model === "911" || model === "Corvette" || model === "M3" || model === "M4") price = 92000;
  else if (model === "Civic" || model === "Corolla" || model === "Camry") price = 18000;

  price -= age * 1800;
  price -= Math.floor(mileage / 1000) * 80;
  return Math.max(3500, price);
}

function describe(input: {
  year: number;
  make: string;
  model: string;
  trim: string;
  mileage: number;
  drivetrain: string;
  engine?: string;
  condition: string;
  city: string;
}) {
  const extras = [
    "Clean Carfax available.",
    "Recently serviced.",
    "No accidents reported.",
    "New tires last year.",
    "Adult owned.",
    "Work truck, well maintained.",
    "Highway miles.",
    "Ready to go.",
  ];
  const engine = input.engine ? ` ${input.engine}.` : "";
  return `${input.year} ${input.make} ${input.model} ${input.trim}.${engine} ${input.drivetrain}, ${input.mileage.toLocaleString()} miles. ${input.condition}. Located in ${input.city}. ${extras[input.year % extras.length]} Serious inquiries only — contact through the original listing.`;
}

function titleFor(year: number, make: string, model: string, trim: string, drivetrain: string, engine?: string, messy = false) {
  if (!messy) return `${year} ${make} ${model} ${trim}`;
  if (make === "Ford" && model === "F-250") {
    return `${year} F250 ${trim}${engine?.includes("6.7") ? " 6.7 Diesel" : ""} ${drivetrain === "4WD" ? "4x4" : ""} low miles`.replace(/\s+/g, " ").trim();
  }
  if (make === "Chevrolet") return `${year} Chevy ${model} ${trim} ${drivetrain}`;
  return `${year} ${make} ${model} ${trim} ${drivetrain}`.trim();
}

export function generateMockListings(count = 120): RawListing[] {
  const rng = mulberry32(42);
  const inventory: Array<{ make: string; model: string; bodyStyle: string; trims: string[]; engines?: string[] }> = [];
  for (const make of VEHICLE_CATALOG) {
    for (const model of make.models) {
      inventory.push({
        make: make.name,
        model: model.name,
        bodyStyle: model.bodyStyle,
        trims: model.trims,
        engines: model.engines,
      });
    }
  }

  const listings: RawListing[] = [];

  listings.push(
    {
      source: "facebook",
      sourceListingId: "mock-showcase-f250",
      sourceUrl: "https://example.com/listings/mock-showcase-f250",
      title: "2019 F250 Lariat 6.7 Diesel 4x4 low miles",
      description:
        "2019 Ford F-250 Lariat. 6.7L Power Stroke diesel. 4x4, 84000 miles. Clean title. Located in Layton. Contact through the original listing.",
      price: 38900,
      year: 2019,
      mileage: 84000,
      condition: "Clean title",
      city: "Layton",
      state: "UT",
      zipCode: "84041",
      latitude: 41.0602,
      longitude: -111.971,
      sellerType: "private",
      sellerName: "Alex M.",
      imageUrls: IMAGES.Pickup.slice(0, 3),
      listedAt: new Date(Date.now() - 8 * 3600000),
    },
    {
      source: "facebook",
      sourceListingId: "mock-showcase-tacoma",
      sourceUrl: "https://example.com/listings/mock-showcase-tacoma",
      title: "2021 Toyota Tacoma TRD Off-Road",
      description:
        "2021 Toyota Tacoma TRD Off-Road. 4WD, 41000 miles. One owner. Located in Salt Lake City.",
      price: 28900,
      year: 2021,
      make: "Toyota",
      model: "Tacoma",
      trim: "TRD Off-Road",
      mileage: 41000,
      condition: "Excellent",
      city: "Salt Lake City",
      state: "UT",
      zipCode: "84101",
      latitude: 40.7608,
      longitude: -111.891,
      sellerType: "private",
      sellerName: "Jordan P.",
      imageUrls: IMAGES.Pickup.slice(1, 4),
      listedAt: new Date(Date.now() - 20 * 3600000),
    },
    {
      source: "facebook",
      sourceListingId: "mock-showcase-911",
      sourceUrl: "https://example.com/listings/mock-showcase-911",
      title: "2018 Porsche 911 Carrera S",
      description:
        "2018 Porsche 911 Carrera S. RWD, 28000 miles. Clean title. Located in Park City.",
      price: 92500,
      year: 2018,
      make: "Porsche",
      model: "911",
      trim: "Carrera S",
      mileage: 28000,
      condition: "Excellent",
      city: "Park City",
      state: "UT",
      zipCode: "84060",
      latitude: 40.6461,
      longitude: -111.498,
      sellerType: "dealer",
      sellerName: "Wasatch Auto Group",
      imageUrls: IMAGES.Coupe.slice(0, 3),
      listedAt: new Date(Date.now() - 30 * 3600000),
    },
  );

  for (let i = 0; i < count; i += 1) {
    const vehicle = inventory[i % inventory.length]!;
    const year = between(rng, 2014, 2024);
    const mileage = between(rng, 12000, 168000);
    const trim = pick(rng, vehicle.trims);
    const city = pick(rng, CITIES);
    const seller = pick(rng, SELLERS);
    const condition = pick(rng, CONDITIONS);
    const drivetrain = vehicle.bodyStyle === "Pickup" || vehicle.bodyStyle === "SUV"
      ? pick(rng, ["4WD", "4WD", "AWD", "RWD"])
      : pick(rng, ["AWD", "RWD", "FWD"]);
    const engine = vehicle.engines ? pick(rng, vehicle.engines) : undefined;
    const market = basePrice(vehicle.make, vehicle.model, year, mileage);
    const jitter = 0.72 + rng() * 0.5;
    const price = Math.round((market * jitter) / 100) * 100;
    const listedDaysAgo = between(rng, 0, 45);
    const listedAt = new Date(Date.now() - listedDaysAgo * 86400000 - between(rng, 0, 86000000));
    const images = IMAGES[vehicle.bodyStyle] ?? IMAGES.SUV;
    const imageCount = 1 + Math.floor(rng() * 3);
    const imageUrls = Array.from({ length: imageCount }, (_, idx) => images[(i + idx) % images.length]!);
    const messy = i % 7 === 0;
    const omitMileage = i % 19 === 0;
    const omitTrim = i % 23 === 0;

    listings.push({
      source: i % 11 === 0 ? "ksl" : "facebook",
      sourceListingId: `mock-${String(i + 1).padStart(3, "0")}`,
      sourceUrl: `https://example.com/listings/mock-${String(i + 1).padStart(3, "0")}`,
      title: titleFor(year, vehicle.make, vehicle.model, omitTrim ? "" : trim, drivetrain, engine, messy),
      description: describe({
        year,
        make: vehicle.make,
        model: vehicle.model,
        trim,
        mileage,
        drivetrain,
        engine,
        condition,
        city: city.city,
      }),
      price,
      year,
      make: messy ? null : vehicle.make,
      model: messy ? null : vehicle.model,
      trim: omitTrim ? null : trim,
      mileage: omitMileage ? null : mileage,
      condition,
      city: city.city,
      state: city.state,
      zipCode: city.zipCode,
      latitude: city.latitude + (rng() - 0.5) * 0.08,
      longitude: city.longitude + (rng() - 0.5) * 0.08,
      sellerType: seller.type,
      sellerName: seller.name,
      imageUrls,
      listedAt,
    });
  }

  listings.push({
    source: "facebook",
    sourceListingId: "mock-dup-001",
    sourceUrl: "https://example.com/listings/mock-dup-001",
    title: listings[0]!.title,
    description: listings[0]!.description,
    price: listings[0]!.price,
    year: listings[0]!.year,
    make: listings[0]!.make,
    model: listings[0]!.model,
    trim: listings[0]!.trim,
    mileage: listings[0]!.mileage,
    city: listings[0]!.city,
    state: listings[0]!.state,
    zipCode: listings[0]!.zipCode,
    latitude: listings[0]!.latitude,
    longitude: listings[0]!.longitude,
    sellerType: listings[0]!.sellerType,
    sellerName: listings[0]!.sellerName,
    imageUrls: listings[0]!.imageUrls,
    listedAt: listings[0]!.listedAt,
  });

  return listings;
}
