export type GeoPoint = {
  latitude: number;
  longitude: number;
};

const EARTH_MILES = 3958.8;

export function haversineMiles(a: GeoPoint, b: GeoPoint) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function boundingBox(center: GeoPoint, radiusMiles: number) {
  const latDelta = radiusMiles / 69;
  const lonDelta =
    radiusMiles / (69 * Math.cos((center.latitude * Math.PI) / 180) || 1);
  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta,
  };
}

export const KNOWN_LOCATIONS: Record<string, GeoPoint & { city: string; state: string }> = {
  "salt lake city": { city: "Salt Lake City", state: "UT", latitude: 40.7608, longitude: -111.891 },
  slc: { city: "Salt Lake City", state: "UT", latitude: 40.7608, longitude: -111.891 },
  layton: { city: "Layton", state: "UT", latitude: 41.0602, longitude: -111.971 },
  provo: { city: "Provo", state: "UT", latitude: 40.2338, longitude: -111.6585 },
  ogden: { city: "Ogden", state: "UT", latitude: 41.223, longitude: -111.9738 },
  "park city": { city: "Park City", state: "UT", latitude: 40.6461, longitude: -111.498 },
  denver: { city: "Denver", state: "CO", latitude: 39.7392, longitude: -104.9903 },
  boise: { city: "Boise", state: "ID", latitude: 43.615, longitude: -116.2023 },
  phoenix: { city: "Phoenix", state: "AZ", latitude: 33.4484, longitude: -112.074 },
  "las vegas": { city: "Las Vegas", state: "NV", latitude: 36.1699, longitude: -115.1398 },
  dallas: { city: "Dallas", state: "TX", latitude: 32.7767, longitude: -96.797 },
  austin: { city: "Austin", state: "TX", latitude: 30.2672, longitude: -97.7431 },
  portland: { city: "Portland", state: "OR", latitude: 45.5152, longitude: -122.6784 },
  seattle: { city: "Seattle", state: "WA", latitude: 47.6062, longitude: -122.3321 },
  "los angeles": { city: "Los Angeles", state: "CA", latitude: 34.0522, longitude: -118.2437 },
  "san diego": { city: "San Diego", state: "CA", latitude: 32.7157, longitude: -117.1611 },
};

export function resolveLocation(query?: string | null) {
  if (!query) return null;
  const key = query.trim().toLowerCase();
  if (KNOWN_LOCATIONS[key]) return KNOWN_LOCATIONS[key];
  const city = key.split(",")[0]?.trim();
  if (city && KNOWN_LOCATIONS[city]) return KNOWN_LOCATIONS[city];
  return null;
}
