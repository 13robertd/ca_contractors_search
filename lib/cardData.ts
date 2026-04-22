/**
 * ContractorCardData — the normalized shape consumed by the shared
 * <ContractorCardBase> component. Both the homepage (mock data) and
 * the search / saved pages (Supabase rows) project into this shape,
 * so one card renders them all.
 *
 * Designed to be narrow: only fields the card actually shows. Adding a
 * new field? Add it here first, then extend each adapter.
 *
 * Visual colors are resolved DOWNSTREAM via `getTradeStyle()` in
 * `lib/trade-colors.ts`, keyed by `primaryTradeLabel` or individual
 * `serviceTags` entries. This file stays color-agnostic.
 */

import type { Contractor } from "@/types/contractor";
import type { ContractorListing } from "@/lib/listings";
import type { MockContractor } from "@/lib/mockContractors";
import { mockContractorToContractor } from "@/lib/mockContractors";
import {
  TRADE_TAXONOMY,
  tradeFromClass,
  type TradeSlug,
} from "@/lib/trades";

export interface TrustFlags {
  active?: boolean;
  workersComp?: boolean;
  bonded?: boolean;
  /** Renders a warning pill; truthy iff the contractor has disciplinary history. */
  discipline?: boolean;
  /** Renders a danger pill. */
  pendingSuspension?: boolean;
}

export interface ContractorCardData {
  licenseNumber: string;
  businessName: string;
  /** Short, human label — "Plumbing", "General Building", "Multi-trade
   *  contractor". Used for both the subtitle and trade-color lookup. */
  primaryTradeLabel: string;
  city: string | null;
  trust: TrustFlags;
  /** All license classifications (prettified — "C-36 Plumbing" not
   *  "C-36 Plumbing Contractor"). Drives both the tag row on the
   *  detailed variant AND the classification-dot overflow indicator
   *  when a contractor holds ≥4 trades. */
  serviceTags: string[];
  /** Raw count before truncation — preserved separately so the card
   *  can decide whether to render the dot overflow row without having
   *  to re-count `serviceTags`. */
  classificationCount: number;
  yearsInBusiness: number | null;
  phone: string | null;
}

/** Strip the trailing "Contractor" from a CSLB classification label. */
function prettyTag(label: string): string {
  return label.replace(/\s+Contractor\s*$/i, "").trim() || label;
}

/**
 * Resolve a contractor's trade slugs from `classification_codes`,
 * falling back to parsing the leading code out of
 * `classification_labels` for rows that didn't fetch the codes column.
 */
function resolveTradeSlugs(c: {
  classification_codes?: string[] | null;
  classification_labels?: string[] | null;
}): TradeSlug[] {
  const codes =
    c.classification_codes && c.classification_codes.length > 0
      ? c.classification_codes
      : (c.classification_labels ?? []).map((label) => {
          const m = label.trim().match(/^([A-Z]-?\d+|B)\b/i);
          return m ? m[1].toUpperCase() : "";
        });

  const slugs: TradeSlug[] = [];
  for (const code of codes) {
    if (!code) continue;
    const slug = tradeFromClass(code);
    if (!slugs.includes(slug)) slugs.push(slug);
  }
  return slugs;
}

interface AdaptOpts {
  /**
   * If the user is viewing a trade-filtered search page, the active
   * trade slug. When the contractor holds that trade we promote it to
   * the primary so the card border + icon match what the user
   * searched for.
   */
  searchTrade?: TradeSlug | null;
}

/**
 * Pick the trade slug that drives the primary display.
 *
 *   1. If `searchTrade` is provided AND the contractor holds that
 *      trade → use it.
 *   2. Otherwise the first non-"general" trade slug.
 *   3. Otherwise the first slug at all.
 *   4. Otherwise null → "Multi-trade contractor" subtitle + default
 *      gray style.
 */
function pickPrimaryTrade(
  slugs: TradeSlug[],
  searchTrade?: TradeSlug | null
): TradeSlug | null {
  if (slugs.length === 0) return null;
  if (searchTrade && slugs.includes(searchTrade)) return searchTrade;
  const firstNonGeneral = slugs.find((s) => s !== "general");
  return firstNonGeneral ?? slugs[0];
}

function adaptCommon(
  c: Pick<
    Contractor,
    | "license_number"
    | "business_name"
    | "city"
    | "phone"
    | "years_in_business"
    | "is_active"
    | "has_workers_comp"
    | "has_contractor_bond"
    | "has_disciplinary_history"
    | "has_pending_suspension"
    | "classification_labels"
    | "classification_codes"
    | "classification_count"
    | "primary_trade"
  >,
  opts: AdaptOpts = {}
): ContractorCardData {
  const slugs = resolveTradeSlugs(c);
  const primary = pickPrimaryTrade(slugs, opts.searchTrade);

  // Prefer the DB's primary_trade string when present (more authoritative
  // for real rows); fall back to the taxonomy label for the slug we
  // picked; final fallback "Multi-trade contractor".
  const primaryLabel =
    c.primary_trade ??
    (primary ? TRADE_TAXONOMY[primary].label : null) ??
    "Multi-trade contractor";

  const serviceTags = (c.classification_labels ?? []).map(prettyTag);

  return {
    licenseNumber: c.license_number,
    businessName: c.business_name,
    primaryTradeLabel: primaryLabel,
    city: c.city ?? null,
    trust: {
      active: !!c.is_active,
      workersComp: !!c.has_workers_comp,
      bonded: !!c.has_contractor_bond,
      discipline: !!c.has_disciplinary_history,
      pendingSuspension: !!c.has_pending_suspension,
    },
    serviceTags,
    classificationCount:
      c.classification_count ?? (c.classification_labels?.length ?? 0),
    yearsInBusiness: c.years_in_business ?? null,
    phone: c.phone ?? null,
  };
}

export function cardDataFromContractor(
  c: Contractor | ContractorListing,
  opts: AdaptOpts = {}
): ContractorCardData {
  return adaptCommon(c, opts);
}

export function cardDataFromMock(
  m: MockContractor,
  opts: AdaptOpts = {}
): ContractorCardData {
  // Mocks already have a Contractor adapter — reuse it so behavior stays
  // in sync with what the detail page would render for the same entry.
  return adaptCommon(mockContractorToContractor(m), opts);
}
