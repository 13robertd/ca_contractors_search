/**
 * Geo utilities for the search experience.
 *
 * Today the contractors table has no lat/lng columns, so we derive a
 * deterministic mock coordinate per license_number from a city centroid lookup
 * + per-license jitter. Once real coordinates land in the DB, only
 * `coordsForListing` needs to change — the rest of the search experience
 * (bounds filtering, markers) is already coordinate-agnostic.
 */

export type LngLat = { longitude: number; latitude: number };

export type Bounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

// Approximate centroid of San Mateo County (where current data lives)
export const DEFAULT_CENTER: LngLat = {
  longitude: -122.31,
  latitude: 37.51,
};
export const DEFAULT_ZOOM = 9.6;

// Bay Area city centroids (longitude, latitude). Add more cities as data grows.
const CITY_CENTROIDS: Record<string, LngLat> = {
  "san mateo":          { longitude: -122.3255, latitude: 37.5630 },
  "redwood city":       { longitude: -122.2364, latitude: 37.4852 },
  "menlo park":         { longitude: -122.1817, latitude: 37.4530 },
  "palo alto":          { longitude: -122.1430, latitude: 37.4419 },
  "burlingame":         { longitude: -122.3661, latitude: 37.5779 },
  "millbrae":           { longitude: -122.3872, latitude: 37.5985 },
  "san bruno":          { longitude: -122.4111, latitude: 37.6305 },
  "south san francisco":{ longitude: -122.4072, latitude: 37.6547 },
  "daly city":          { longitude: -122.4702, latitude: 37.6879 },
  "brisbane":           { longitude: -122.3997, latitude: 37.6808 },
  "pacifica":           { longitude: -122.4869, latitude: 37.6138 },
  "half moon bay":      { longitude: -122.4286, latitude: 37.4636 },
  "foster city":        { longitude: -122.2711, latitude: 37.5585 },
  "belmont":            { longitude: -122.2758, latitude: 37.5202 },
  "san carlos":         { longitude: -122.2608, latitude: 37.5072 },
  "atherton":           { longitude: -122.1986, latitude: 37.4613 },
  "east palo alto":     { longitude: -122.1411, latitude: 37.4688 },
  "woodside":           { longitude: -122.2539, latitude: 37.4297 },
  "portola valley":     { longitude: -122.2353, latitude: 37.3841 },
  "hillsborough":       { longitude: -122.3567, latitude: 37.5610 },
  "colma":              { longitude: -122.4581, latitude: 37.6772 },
  "san francisco":      { longitude: -122.4194, latitude: 37.7749 },
  "oakland":            { longitude: -122.2712, latitude: 37.8044 },
};

const COUNTY_CENTROIDS: Record<string, LngLat> = {
  "san mateo": { longitude: -122.3705, latitude: 37.4337 },
  "santa clara": { longitude: -121.9552, latitude: 37.3541 },
  "alameda": { longitude: -121.9018, latitude: 37.6017 },
  "san francisco": { longitude: -122.4194, latitude: 37.7749 },
};

// Stable, fast string hash → 32-bit unsigned int. Used to seed jitter so the
// same license_number always lands on the same coords.
function hash32(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i); // h * 33 ^ char
  }
  return h >>> 0;
}

// Two deterministic [-1, 1) values from a string.
function jitterPair(seed: string): [number, number] {
  const h = hash32(seed);
  const a = ((h & 0xffff) / 0xffff) * 2 - 1;
  const b = (((h >>> 16) & 0xffff) / 0xffff) * 2 - 1;
  return [a, b];
}

/**
 * Resolve a stable mock coordinate for a contractor based on city/county and a
 * stable seed (license_number). Returns null if neither city nor county map to
 * a known centroid (we'd rather hide those off-map than place them randomly).
 */
export function coordsForListing(args: {
  city: string | null | undefined;
  county: string | null | undefined;
  seed: string;
}): LngLat | null {
  const cityKey = args.city?.trim().toLowerCase();
  const countyKey = args.county?.trim().toLowerCase();

  const base =
    (cityKey && CITY_CENTROIDS[cityKey]) ||
    (countyKey && COUNTY_CENTROIDS[countyKey]) ||
    null;
  if (!base) return null;

  // ~0.012° jitter ≈ ~1.3km lat / ~1km lng at 37°N — keeps pins inside the city
  // without overlapping. Cluster a bit tighter when city is unknown.
  const radius = cityKey && CITY_CENTROIDS[cityKey] ? 0.012 : 0.05;
  const [jx, jy] = jitterPair(args.seed);

  return {
    longitude: base.longitude + jx * radius,
    latitude: base.latitude + jy * radius,
  };
}

/** Inclusive point-in-bounds test. */
export function isInBounds(point: LngLat, b: Bounds): boolean {
  return (
    point.longitude >= b.west &&
    point.longitude <= b.east &&
    point.latitude >= b.south &&
    point.latitude <= b.north
  );
}
