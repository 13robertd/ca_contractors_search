/**
 * Shared types for the contractor geocoding pipeline (Census + Nominatim).
 */

export type GeocodePrecision =
  | "rooftop"
  | "street"
  | "interpolated"
  | "city"
  | "zip"
  | "failed";

export type GeocodeSource = "census" | "nominatim";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  precision: GeocodePrecision;
  source: GeocodeSource;
  /** Provider-specific label for logs */
  rawLabel?: string;
}
