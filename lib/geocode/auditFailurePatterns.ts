/**
 * Heuristic failure buckets for geocode audit CSVs (read-only; no DB writes).
 *
 * | Pattern | Meaning |
 * |---------|---------|
 * | missing_street_address | No / unusable street line |
 * | po_box | PO Box / HC Box style mailing |
 * | suite_unit_only | Looks like suite/unit line only (no street number) |
 * | malformed_address | Control chars, junk commas, or un-normalizable |
 * | bad_city_or_zip | Missing city or invalid US ZIP |
 * | duplicate_strange_address | Same normalized key as another audit row (shared cluster) |
 * | provider_or_unknown | Address normalizes but geocode failed / no coords after attempt |
 * | never_geocoded_pending | No coords yet and pipeline has not recorded an attempt |
 *
 * `provider_or_unknown` groups Census/Nominatim non-match, timeouts, and other
 * API outcomes — we do not persist provider error codes on the row today.
 */

import type { AddressParts } from "./normalizeAddress";
import { addressDedupeKey, normalizeAddressForGeocode } from "./normalizeAddress";

export type FailurePattern =
  | "missing_street_address"
  | "po_box"
  | "suite_unit_only"
  | "malformed_address"
  | "bad_city_or_zip"
  | "duplicate_strange_address"
  | "provider_or_unknown"
  | "never_geocoded_pending";

const PO_BOX = /\bp\.?\s*o\.?\s*box\b/i;
const HC_BOX = /\bhc\s*box\b/i;
const CONTROL = /[\u0000-\u001F\u007F]/;
/** Street line looks like only suite / unit / floor without a plausible street number. */
const SUITE_LEADING =
  /^(suite|ste\.?|unit|apt|apartment|bldg|building|fl\.?|floor|rm\.?|room|#)\b/i;
const HAS_STREET_NUMBER = /^\d{1,6}[a-z]?\s+/i;

function digitsOnlyZip(z: string): string {
  return z.replace(/\D/g, "");
}

function isValidUsZip(z: string | null | undefined): boolean {
  if (!z?.trim()) return false;
  const d = digitsOnlyZip(z);
  return d.length === 5 || d.length === 9;
}

function isMalformedStreet(street: string): boolean {
  if (!street) return false;
  if (CONTROL.test(street)) return true;
  if (/[,]{3,}/.test(street)) return true;
  if (/^\s*[,]+\s*$/.test(street)) return true;
  if (street.length > 200) return true;
  return false;
}

function hasCoords(ctx: {
  latitude: number | null;
  longitude: number | null;
}): boolean {
  return (
    ctx.latitude != null &&
    ctx.longitude != null &&
    Number.isFinite(Number(ctx.latitude)) &&
    Number.isFinite(Number(ctx.longitude))
  );
}

/**
 * Primary failure reason before duplicate-cluster tagging.
 */
export function classifyGeocodeFailure(
  parts: AddressParts,
  ctx: {
    geocode_status: string | null;
    geocode_attempts: number | null;
    latitude: number | null;
    longitude: number | null;
  }
): FailurePattern {
  const street = (parts.address ?? "").trim();
  const city = (parts.city ?? "").trim();
  const zipRaw = parts.zip_code ?? "";
  const coords = hasCoords(ctx);
  const attempted = (ctx.geocode_attempts ?? 0) > 0;
  const failed = ctx.geocode_status === "failed";
  const normalized = normalizeAddressForGeocode(parts);

  if (!street || street.length < 2) {
    return "missing_street_address";
  }

  if (PO_BOX.test(street) || HC_BOX.test(street)) {
    return "po_box";
  }

  if (isMalformedStreet(street)) {
    return "malformed_address";
  }

  if (SUITE_LEADING.test(street) && !HAS_STREET_NUMBER.test(street)) {
    return "suite_unit_only";
  }

  if (!city) {
    return "bad_city_or_zip";
  }

  if (!isValidUsZip(zipRaw)) {
    return "bad_city_or_zip";
  }

  if (!coords && !attempted && (ctx.geocode_status == null || ctx.geocode_status === "")) {
    return normalized ? "never_geocoded_pending" : "malformed_address";
  }

  if (failed || (attempted && !coords)) {
    return normalized ? "provider_or_unknown" : "malformed_address";
  }

  if (!coords) {
    return normalized ? "never_geocoded_pending" : "malformed_address";
  }

  return "provider_or_unknown";
}

/** Do not override these when tagging duplicate clusters. */
const STRONG_DEDUPE_EXEMPT = new Set<FailurePattern>([
  "missing_street_address",
  "po_box",
  "suite_unit_only",
  "bad_city_or_zip",
]);

/**
 * When the same normalized dedupe key appears on 2+ audit rows, tag rows as
 * `duplicate_strange_address` (shared / ambiguous mailing cluster) unless
 * they already have a stronger data-quality bucket.
 */
export function applyDuplicateStrangeCluster<
  T extends {
    failure_pattern: FailurePattern;
    dedupe_key: string | null;
  },
>(rows: T[]): void {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = r.dedupe_key;
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  for (const r of rows) {
    const k = r.dedupe_key;
    if (!k || (counts.get(k) ?? 0) < 2) continue;
    if (!STRONG_DEDUPE_EXEMPT.has(r.failure_pattern)) {
      r.failure_pattern = "duplicate_strange_address";
    }
  }
}

export function buildDedupeKey(parts: AddressParts): string | null {
  return addressDedupeKey(parts);
}
