/**
 * US Census Bureau Geocoder (free, no API key).
 * Coordinates are interpolated along MAF/TIGER ranges — treat as `interpolated`
 * unless we detect a stronger signal in the payload.
 *
 * https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
 */

import type { GeocodePrecision, GeocodeResult } from "../types";

const CENSUS_URL =
  "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";

interface CensusCoordinates {
  x: number;
  y: number;
}

interface CensusAddressMatch {
  matchedAddress?: string;
  coordinates?: CensusCoordinates;
  tigerLine?: { tigerLineId?: string; side?: string };
  addressComponents?: {
    fromAddress?: string;
    toAddress?: string;
    streetName?: string;
    zip?: string;
    city?: string;
    state?: string;
  };
}

interface CensusResponse {
  result?: {
    addressMatches?: CensusAddressMatch[];
  };
}

function censusPrecision(m: CensusAddressMatch): GeocodePrecision {
  const ac = m.addressComponents;
  const hasStreet =
    !!(ac?.streetName && String(ac.streetName).trim()) &&
    !!(ac?.fromAddress && String(ac.fromAddress).trim());
  const hasZip = !!(ac?.zip && String(ac.zip).trim());
  const hasCity = !!(ac?.city && String(ac.city).trim());

  if (hasStreet && m.tigerLine?.tigerLineId) {
    // Census documents coordinates as interpolated along the segment.
    const from = ac?.fromAddress ?? "";
    const to = ac?.toAddress ?? "";
    if (
      from &&
      to &&
      from.trim() === to.trim() &&
      m.matchedAddress?.includes(from)
    ) {
      return "street";
    }
    return "interpolated";
  }
  if (hasZip && hasCity) return "zip";
  if (hasCity) return "city";
  return "interpolated";
}

export async function geocodeCensusOneLine(
  oneLineAddress: string,
  opts: { timeoutMs?: number } = {}
): Promise<GeocodeResult | null> {
  const timeoutMs = opts.timeoutMs ?? 22_000;
  const url = new URL(CENSUS_URL);
  url.searchParams.set("address", oneLineAddress);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      signal: ac.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as CensusResponse;
    const matches = json.result?.addressMatches;
    if (!matches?.length) return null;
    const m = matches[0];
    const c = m.coordinates;
    if (!c || typeof c.x !== "number" || typeof c.y !== "number") return null;
    const lon = c.x;
    const lat = c.y;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      latitude: lat,
      longitude: lon,
      precision: censusPrecision(m),
      source: "census",
      rawLabel: m.matchedAddress,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
