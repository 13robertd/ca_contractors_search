/**
 * Build a single-line US mailing address for geocoders.
 * Prefer: "{street}, {city}, CA {zip}" then fall back per field availability.
 */

export interface AddressParts {
  address: string | null | undefined;
  city: string | null | undefined;
  state: string | null | undefined;
  zip_code: string | null | undefined;
}

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function stripDupCommas(s: string): string {
  return s.replace(/,\s*,/g, ", ").replace(/^,\s*|,\s*$/g, "").trim();
}

/** USPS-style state default for CA contractor data */
const DEFAULT_STATE = "CA";

/**
 * Returns normalized one-line address, or null if insufficient (no city and no zip).
 */
export function normalizeAddressForGeocode(parts: AddressParts): string | null {
  const street = collapseSpaces(parts.address ?? "");
  const city = collapseSpaces(parts.city ?? "");
  const stateRaw = collapseSpaces(parts.state ?? "");
  const state = stateRaw ? stateRaw.toUpperCase() : DEFAULT_STATE;
  const zip = collapseSpaceZip(parts.zip_code ?? "");

  if (street && city) {
    const line = stripDupCommas(`${street}, ${city}, ${state}${zip ? ` ${zip}` : ""}`);
    return line.length > 0 ? line : null;
  }

  if (city) {
    const line = stripDupCommas(`${city}, ${state}${zip ? ` ${zip}` : ""}`);
    return line.length > 0 ? line : null;
  }

  if (zip && state) {
    return `${state} ${zip}`;
  }

  return null;
}

function collapseSpaceZip(z: string): string {
  const t = z.replace(/\s+/g, "").trim();
  if (!t) return "";
  return t.length === 9 ? `${t.slice(0, 5)}-${t.slice(5)}` : t;
}

/** Stable key for duplicate-address dedupe within a batch run */
export function addressDedupeKey(parts: AddressParts): string | null {
  const line = normalizeAddressForGeocode(parts);
  return line ? addressDedupeKeyFromLine(line) : null;
}

/** Dedupe key from any normalized one-line address (Pass 2 variant lines). */
export function addressDedupeKeyFromLine(line: string): string {
  return line.trim().toLowerCase().replace(/\s+/g, " ");
}
