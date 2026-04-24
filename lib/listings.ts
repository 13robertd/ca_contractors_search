/**
 * Augments a Contractor record with map/list fields. Map coordinates come
 * only from {@link resolveMapPin} in `lib/geo.ts` (precise vs approximate);
 * rows without a pin still appear in the results list.
 *
 * No synthetic ratings, reviews, or prices: all other fields come straight
 * from the public license record.
 */

import type { Contractor } from "@/types/contractor";
import { resolveMapPin, type MapPinKind } from "@/lib/geo";

export interface ContractorListing extends Contractor {
  /** Map pin position when shown; null when hidden from the map. */
  latitude: number | null;
  longitude: number | null;
  /** Drives map styling: precise (rooftop/street/interpolated) vs city/zip approximate. */
  mapPinKind: MapPinKind | null;
  /** "Brisbane · San Mateo County" — precomputed for cards and markers. */
  distanceLabel: string;
}

function distanceLabel(c: Contractor): string {
  const parts: string[] = [];
  if (c.city) parts.push(c.city);
  if (c.county) parts.push(`${c.county} County`);
  return parts.join(" · ");
}

export function toListing(c: Contractor): ContractorListing {
  const pin = resolveMapPin({
    city: c.city,
    county: c.county,
    seed: c.license_number,
    dbLatitude: c.latitude ?? null,
    dbLongitude: c.longitude ?? null,
    geocodePrecision: c.geocode_precision ?? null,
    geocodeStatus: c.geocode_status ?? null,
  });

  return {
    ...c,
    latitude: pin?.latitude ?? null,
    longitude: pin?.longitude ?? null,
    mapPinKind: pin?.kind ?? null,
    distanceLabel: distanceLabel(c),
  };
}

export function toListings(rows: Contractor[]): ContractorListing[] {
  return rows.map(toListing);
}
