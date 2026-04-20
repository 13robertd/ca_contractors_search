/**
 * Augments a Contractor record with the geo fields the split-screen search UI
 * needs (lat/lng + a human-readable distance label). Coordinates are derived
 * deterministically from city + license_number until the DB has real lat/lng
 * columns — see `lib/geo.ts` for the lookup.
 *
 * No synthetic ratings, reviews, or prices: all other fields come straight
 * from the public license record.
 */

import type { Contractor } from "@/types/contractor";
import { coordsForListing, type LngLat } from "@/lib/geo";

export interface ContractorListing extends Contractor {
  latitude: number | null;
  longitude: number | null;
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
  const coords: LngLat | null = coordsForListing({
    city: c.city,
    county: c.county,
    seed: c.license_number,
  });

  return {
    ...c,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    distanceLabel: distanceLabel(c),
  };
}

export function toListings(rows: Contractor[]): ContractorListing[] {
  return rows.map(toListing);
}
