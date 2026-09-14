export type Coordinates = { latitude: number; longitude: number };

const EARTH_MILES = 3958.8;

export function haversineMiles(a: Coordinates, b: Coordinates) {
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

export function formatDistance(miles: number | null | undefined) {
  if (miles == null) return "Distance unavailable";
  if (miles < 1) return "Less than a mile away";
  return `${Math.round(miles)} miles away`;
}
