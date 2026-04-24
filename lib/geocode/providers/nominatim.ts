/**
 * OpenStreetMap Nominatim (free; usage policy requires identifiable User-Agent
 * and modest request rate — caller should throttle ~1 req/sec).
 *
 * https://operations.osmfoundation.org/policies/nominatim/
 */

import type { GeocodePrecision, GeocodeResult } from "../types";

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

function nominatimPrecision(
  placeClass: string | undefined,
  placeType: string | undefined,
  addresstype: string | undefined
): GeocodePrecision {
  const cls = (placeClass ?? "").toLowerCase();
  const typ = (placeType ?? "").toLowerCase();
  const at = (addresstype ?? "").toLowerCase();

  if (at === "house" || at === "building" || typ === "house") return "rooftop";
  if (cls === "highway" || at === "road" || typ === "residential")
    return "street";
  if (cls === "place" && (typ === "postcode" || at === "postcode"))
    return "zip";
  if (
    cls === "boundary" &&
    (typ === "administrative" || typ === "postal_code")
  ) {
    return "city";
  }
  if (
    typ === "city" ||
    typ === "town" ||
    typ === "village" ||
    typ === "hamlet" ||
    at === "city" ||
    at === "town" ||
    at === "village"
  ) {
    return "city";
  }
  if (typ === "postcode" || at === "postcode") return "zip";
  return "street";
}

export async function geocodeNominatim(
  oneLineAddress: string,
  opts: { timeoutMs?: number; contactEmail?: string } = {}
): Promise<GeocodeResult | null> {
  const timeoutMs = opts.timeoutMs ?? 25_000;
  const email =
    opts.contactEmail?.trim() ||
    process.env.GEOCODE_CONTACT_EMAIL?.trim() ||
    "dev@localhost.invalid";

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", oneLineAddress);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("email", email);

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      signal: ac.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": `FixdContractorGeocoder/1.0 (${email})`,
      },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{
      lat?: string;
      lon?: string;
      class?: string;
      type?: string;
      addresstype?: string;
      display_name?: string;
    }>;
    const hit = arr?.[0];
    if (!hit?.lat || !hit.lon) return null;
    const lat = Number.parseFloat(hit.lat);
    const lon = Number.parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      latitude: lat,
      longitude: lon,
      precision: nominatimPrecision(hit.class, hit.type, hit.addresstype),
      source: "nominatim",
      rawLabel: hit.display_name,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
