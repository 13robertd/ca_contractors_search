/**
 * Pass 2 address cleanup: ordered retry strings (A→F) for failed geocodes.
 * See scripts/geocode-pass2.ts.
 */

import type { AddressParts } from "./normalizeAddress";
import { normalizeAddressForGeocode } from "./normalizeAddress";

export type Pass2VariantCode = "A" | "B" | "C" | "D" | "E" | "F";

export interface Pass2Variant {
  code: Pass2VariantCode;
  /** One-line string sent to Census / Nominatim */
  line: string;
  /** When true, reject street/rooftop/interpolated hits (city-level only). */
  mailingOnlyContext: boolean;
}

const PO_RE =
  /\b(p\.?\s*o\.?\s*box|post\s*office\s*box|hc\s*box|box\s+#?\d+)\b/i;

export function looksLikePoBoxMailing(address: string | null | undefined): boolean {
  if (!address?.trim()) return false;
  return PO_RE.test(address);
}

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
}

function collapseSpaceZip(z: string): string {
  const t = z.replace(/\D/g, "").trim();
  if (!t) return "";
  return t.length === 9 ? `${t.slice(0, 5)}-${t.slice(5)}` : t;
}

const DEFAULT_STATE = "CA";

/** Strip suite / unit / floor / PMB / # tokens (Version B). */
export function stripSuiteAndUnitTokens(street: string): string {
  let s = street;
  s = s.replace(
    /\b(suite|ste\.?|unit|apt|apartment|bldg|building|fl\.?|floor|pmb|rm\.?|room)\s*[a-z0-9#-]*\b/gi,
    " "
  );
  s = s.replace(/#\s*\d+[a-z]?\b/gi, " ");
  s = collapseSpaces(s.replace(/[,]{2,}/g, ",").replace(/^,|,$/g, ""));
  return s;
}

/** Street suffix normalization (Version D). */
export function normalizeStreetSuffixes(street: string): string {
  const suf: [RegExp, string][] = [
    [/\bstreet\b/gi, "St"],
    [/\bst\.?\b/gi, "St"],
    [/\bavenue\b/gi, "Ave"],
    [/\bave\.?\b/gi, "Ave"],
    [/\bboulevard\b/gi, "Blvd"],
    [/\bblvd\.?\b/gi, "Blvd"],
    [/\broad\b/gi, "Rd"],
    [/\brd\.?\b/gi, "Rd"],
    [/\bdrive\b/gi, "Dr"],
    [/\bdr\.?\b/gi, "Dr"],
    [/\blane\b/gi, "Ln"],
    [/\bln\.?\b/gi, "Ln"],
    [/\bcourt\b/gi, "Ct"],
    [/\bct\.?\b/gi, "Ct"],
  ];
  let out = street;
  for (const [re, rep] of suf) {
    out = out.replace(re, rep);
  }
  return collapseSpaces(out.replace(/\.+/g, "."));
}

function partsWithStreet(
  base: AddressParts,
  street: string
): AddressParts {
  return {
    ...base,
    address: street,
  };
}

function versionE(parts: AddressParts): string | null {
  const city = collapseSpaces(parts.city ?? "");
  const state = (parts.state ?? "").trim()
    ? (parts.state ?? "").trim().toUpperCase()
    : DEFAULT_STATE;
  const zip = collapseSpaceZip(parts.zip_code ?? "");
  if (!city) return null;
  return collapseSpaces(`${city}, ${state}${zip ? ` ${zip}` : ""}`);
}

function versionF(parts: AddressParts): string | null {
  const city = collapseSpaces(parts.city ?? "");
  const state = (parts.state ?? "").trim()
    ? (parts.state ?? "").trim().toUpperCase()
    : DEFAULT_STATE;
  if (!city) return null;
  return collapseSpaces(`${city}, ${state}`);
}

/**
 * Ordered variants A–F (deduped). Version C is represented via `mailingOnlyContext`
 * on variants that still contain PO-style text in the street portion.
 */
export function buildPass2Variants(parts: AddressParts): Pass2Variant[] {
  const out: Pass2Variant[] = [];
  const seen = new Set<string>();

  const push = (
    code: Pass2VariantCode,
    line: string | null,
    mailingOnlyContext: boolean
  ) => {
    if (!line) return;
    const k = line.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ code, line, mailingOnlyContext });
  };

  const rawStreet = (parts.address ?? "").trim();
  const po = looksLikePoBoxMailing(rawStreet);

  // A — full normalized (original pipeline)
  const aLine = normalizeAddressForGeocode(parts);
  push("A", aLine, po);

  // B — strip suite / unit from street, then normalize
  if (rawStreet) {
    const stripped = stripSuiteAndUnitTokens(rawStreet);
    if (stripped && stripped !== rawStreet) {
      push(
        "B",
        normalizeAddressForGeocode(partsWithStreet(parts, stripped)),
        looksLikePoBoxMailing(stripped)
      );
    }
  }

  // D — suffix-normalized street
  if (rawStreet) {
    const dStreet = normalizeStreetSuffixes(stripSuiteAndUnitTokens(rawStreet));
    if (dStreet && dStreet !== rawStreet) {
      push(
        "D",
        normalizeAddressForGeocode(partsWithStreet(parts, dStreet)),
        looksLikePoBoxMailing(dStreet)
      );
    }
  }

  // E / F — city fallbacks (always mailingOnlyContext when original was PO)
  push("E", versionE(parts), po);
  push("F", versionF(parts), po);

  // C — explicit PO handling: prefer city fallbacks first when PO-only mailing
  if (po) {
    const e = versionE(parts);
    const f = versionF(parts);
    const rest = out.filter((v) => v.code !== "E" && v.code !== "F");
    const cityFirst: Pass2Variant[] = [];
    const seen2 = new Set<string>();
    const add = (v: Pass2Variant) => {
      const k = v.line.toLowerCase();
      if (seen2.has(k)) return;
      seen2.add(k);
      cityFirst.push(v);
    };
    if (e) add({ code: "E", line: e, mailingOnlyContext: true });
    if (f) add({ code: "F", line: f, mailingOnlyContext: true });
    for (const v of rest) add({ ...v, mailingOnlyContext: true });
    return cityFirst;
  }

  return out;
}
