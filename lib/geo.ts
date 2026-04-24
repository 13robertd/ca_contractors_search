/**
 * Geo utilities for the search experience.
 *
 * Map pins come only from {@link resolveMapPin}: strong DB precisions
 * (rooftop / street / interpolated) as **precise** pins, city/zip DB
 * coordinates as **approximate** pins. Mailing-only / failed pass-2 rows and
 * rows without usable DB coordinates do not get map pins (list still shows
 * them).
 */

export type LngLat = { longitude: number; latitude: number };

export type Bounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

/** Precisions we trust for exact-ish pin placement on the consumer map. */
export const STRONG_GEOCODE_PRECISIONS = new Set([
  "rooftop",
  "street",
  "interpolated",
]);

/** City / zip DB geocodes — shown as lower-confidence markers, not clustered with precise pins. */
export const APPROXIMATE_GEOCODE_PRECISIONS = new Set(["city", "zip"]);

export type MapPinKind = "precise" | "approximate";

export type MapPin = {
  latitude: number;
  longitude: number;
  kind: MapPinKind;
};

/**
 * Resolves coordinates for a map pin, or null when the row should not appear
 * on the map (no synthetic centroid/jitter — avoids misleading density).
 */
export function resolveMapPin(args: CoordsForListingArgs): MapPin | null {
  const st = args.geocodeStatus?.trim().toLowerCase() ?? "";
  if (st === "mailing_only" || st === "failed_pass2") {
    return null;
  }

  const lat = args.dbLatitude;
  const lng = args.dbLongitude;
  const p = args.geocodePrecision?.trim().toLowerCase() ?? "";

  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !p
  ) {
    return null;
  }

  if (STRONG_GEOCODE_PRECISIONS.has(p)) {
    return { latitude: lat, longitude: lng, kind: "precise" };
  }

  if (APPROXIMATE_GEOCODE_PRECISIONS.has(p)) {
    return { latitude: lat, longitude: lng, kind: "approximate" };
  }

  return null;
}

// Approximate centroid of San Mateo County (where current data lives)
export const DEFAULT_CENTER: LngLat = {
  longitude: -122.31,
  latitude: 37.51,
};
/** Search map default — above GeoJSON `clusterMaxZoom` (11) so trade pins render on first paint. */
export const DEFAULT_ZOOM = 11.6;

export interface CoordsForListingArgs {
  city: string | null | undefined;
  county: string | null | undefined;
  seed: string;
  /** Populated by Supabase after batch geocoding */
  dbLatitude?: number | null;
  dbLongitude?: number | null;
  geocodePrecision?: string | null;
  /** Rows with `mailing_only` or `failed_pass2` never get map pins. */
  geocodeStatus?: string | null;
}

/**
 * @deprecated Use {@link resolveMapPin} for map placement. Kept as a thin
 * wrapper so older call sites still compile.
 */
export function coordsForListing(args: CoordsForListingArgs): LngLat | null {
  const pin = resolveMapPin(args);
  return pin
    ? { latitude: pin.latitude, longitude: pin.longitude }
    : null;
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
