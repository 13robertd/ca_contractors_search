/**
 * Provider order: US Census (primary) → Nominatim (secondary).
 */

import type { AddressParts } from "./normalizeAddress";
import { normalizeAddressForGeocode } from "./normalizeAddress";
import { geocodeCensusOneLine } from "./providers/census";
import { geocodeNominatim } from "./providers/nominatim";
import type { GeocodeResult } from "./types";

const CENSUS_DELAY_MS = 250;
const NOMINATIM_DELAY_MS = 1100;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Prefer the more precise of two successful results (Nominatim may beat Census). */
const RANK: Record<GeocodeResult["precision"], number> = {
  rooftop: 6,
  street: 5,
  interpolated: 4,
  zip: 2,
  city: 1,
  failed: 0,
};

function pickBetter(a: GeocodeResult, b: GeocodeResult): GeocodeResult {
  const ra = RANK[a.precision];
  const rb = RANK[b.precision];
  if (rb > ra) return b;
  if (ra > rb) return a;
  // Same rank: prefer Census for reproducibility when tied
  return a.source === "census" ? a : b;
}

export async function geocodeAddressParts(
  parts: AddressParts,
  opts: { contactEmail?: string } = {}
): Promise<GeocodeResult | null> {
  const oneLine = normalizeAddressForGeocode(parts);
  if (!oneLine) return null;
  return geocodeOneLineAddress(oneLine, opts);
}

/** Census → Nominatim for an arbitrary one-line US address (Pass 2 retries). */
export async function geocodeOneLineAddress(
  oneLine: string,
  opts: { contactEmail?: string } = {}
): Promise<GeocodeResult | null> {
  const line = oneLine?.trim();
  if (!line) return null;

  await sleep(CENSUS_DELAY_MS);
  const census = await geocodeCensusOneLine(line);

  await sleep(NOMINATIM_DELAY_MS);
  const nomi = await geocodeNominatim(line, {
    contactEmail: opts.contactEmail,
  });

  if (census && nomi) return pickBetter(census, nomi);
  return census ?? nomi ?? null;
}
