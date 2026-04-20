/**
 * Augments a Contractor record with the synthetic marketplace fields the
 * Airbnb-style search UI needs (rating, reviews, hourly rate, cover hue,
 * coordinates). Everything is derived deterministically from data already on
 * the row, so values are stable across renders.
 *
 * When real ratings/reviews/coordinates land in the DB, swap the synth helpers
 * here for direct field reads — the consuming components don't need to change.
 */

import type { Contractor } from "@/types/contractor";
import { coordsForListing, type LngLat } from "@/lib/geo";

export interface ContractorListing extends Contractor {
  latitude: number | null;
  longitude: number | null;
  rating: number;        // 4.0 – 5.0
  reviewCount: number;   // 6 – ~400
  hourlyRate: number;    // dollars/hr
  coverHue: number;      // 0 – 360 for HSL placeholder cover
  distanceLabel: string; // "Brisbane · San Mateo County" etc.
}

// Reasonable starting hourly bands by primary trade keyword. Fall back to a
// general handyman/GC band if no keyword matches.
const TRADE_RATE_BANDS: { match: RegExp; min: number; max: number }[] = [
  { match: /electric/i,           min: 95,  max: 175 },
  { match: /plumb/i,              min: 90,  max: 170 },
  { match: /roof/i,               min: 80,  max: 160 },
  { match: /hvac|heating|air/i,   min: 95,  max: 180 },
  { match: /paint/i,              min: 60,  max: 110 },
  { match: /landscap/i,           min: 55,  max: 105 },
  { match: /tile|floor|carpet/i,  min: 65,  max: 130 },
  { match: /cabinet|millwork/i,   min: 75,  max: 150 },
  { match: /concrete|masonr/i,    min: 70,  max: 140 },
  { match: /solar/i,              min: 110, max: 200 },
  { match: /general building/i,   min: 90,  max: 175 },
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function frac(seed: string, salt: string): number {
  return (hash(seed + ":" + salt) % 10000) / 10000;
}

function synthRating(c: Contractor): number {
  // Base from compliance signals, then deterministic per-license offset.
  let score = 4.2;
  if (c.has_workers_comp) score += 0.15;
  if (c.has_contractor_bond) score += 0.1;
  if (c.is_active) score += 0.1;
  if (c.has_disciplinary_history) score -= 0.25;
  if (c.has_pending_suspension) score -= 0.4;
  if ((c.years_in_business ?? 0) >= 15) score += 0.15;
  if ((c.years_in_business ?? 0) >= 30) score += 0.1;

  const offset = (frac(c.license_number, "rating") - 0.5) * 0.3;
  const raw = score + offset;
  return Math.round(Math.max(4.0, Math.min(5.0, raw)) * 10) / 10;
}

function synthReviewCount(c: Contractor): number {
  const yrs = c.years_in_business ?? 5;
  const base = Math.min(400, 6 + yrs * 4);
  const jitter = Math.floor(frac(c.license_number, "reviews") * base);
  return Math.max(6, base - 30 + jitter);
}

function synthHourlyRate(c: Contractor): number {
  const trade = c.primary_trade ?? "";
  const band = TRADE_RATE_BANDS.find((b) => b.match.test(trade)) ?? {
    min: 75,
    max: 140,
  };
  const f = frac(c.license_number, "rate");
  const yrsBoost = Math.min(20, Math.max(0, (c.years_in_business ?? 0) - 5));
  const raw = band.min + (band.max - band.min) * f + yrsBoost;
  return Math.round(raw / 5) * 5;
}

function synthCoverHue(c: Contractor): number {
  // Spread cover colors across the wheel but keep them consistent per license.
  return Math.floor(frac(c.license_number, "hue") * 360);
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
    rating: synthRating(c),
    reviewCount: synthReviewCount(c),
    hourlyRate: synthHourlyRate(c),
    coverHue: synthCoverHue(c),
    distanceLabel: distanceLabel(c),
  };
}

export function toListings(rows: Contractor[]): ContractorListing[] {
  return rows.map(toListing);
}
