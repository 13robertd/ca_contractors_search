/**
 * Trade taxonomy — the non-visual side of the trade system.
 *
 * - `TRADE_TAXONOMY` — the 8 trade slugs → `{ label, icon }`. Visual
 *   colors are defined separately in `lib/trade-colors.ts` so the
 *   taxonomy stays stable even if the palette is retuned.
 *
 * - `CLASS_TO_TRADE` — maps CSLB classification codes (C-36, C-10, B, …)
 *   to trade slugs.
 *
 * - `deriveType(classifications)` — resolves a contractor's "type"
 *   (Specialist / Skilled / Generalist) from its classifications array.
 *
 * - `primaryTradeFor(classifications)` — returns the first trade slug
 *   implied by the classifications (skipping "B" for primary-trade
 *   purposes; a Generalist's primary is still a C-class when present).
 *
 * For the card/chip/filter colors, import from `lib/trade-colors.ts`.
 */

import {
  Briefcase,
  Droplet,
  Home,
  Layers,
  PaintBucket,
  Snowflake,
  Trees,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type TradeSlug =
  | "plumbing"
  | "electrical"
  | "hvac"
  | "roofing"
  | "painting"
  | "landscape"
  | "flooring"
  | "general";

export type ContractorType = "specialist" | "skilled" | "generalist";

export interface TradeTaxonomyEntry {
  /** Short, human label — also the lookup key into `lib/trade-colors.ts`. */
  label: string;
  /** lucide-react icon — kept in sync with the palette icon by convention. */
  icon: LucideIcon;
}

/**
 * Slug → display label + icon. Colors intentionally live elsewhere —
 * see `lib/trade-colors.ts`.
 */
export const TRADE_TAXONOMY: Record<TradeSlug, TradeTaxonomyEntry> = {
  plumbing:   { label: "Plumbing",    icon: Droplet    },
  electrical: { label: "Electrical",  icon: Zap        },
  hvac:       { label: "HVAC",        icon: Snowflake  },
  roofing:    { label: "Roofing",     icon: Home       },
  painting:   { label: "Painting",    icon: PaintBucket},
  landscape:  { label: "Landscape",   icon: Trees      },
  flooring:   { label: "Flooring",    icon: Layers     },
  general:    { label: "General",     icon: Briefcase  },
};

/**
 * Common CSLB class codes → trade slug. Keep this explicit and narrow;
 * unknown codes fall back to "general".
 */
export const CLASS_TO_TRADE: Record<string, TradeSlug> = {
  B: "general",
  "C-10": "electrical",
  "C-15": "flooring",
  "C-20": "hvac",
  "C-27": "landscape",
  "C-33": "painting",
  "C-36": "plumbing",
  "C-39": "roofing",
};

export function tradeFromClass(code: string): TradeSlug {
  return CLASS_TO_TRADE[code] ?? "general";
}

/**
 * Classify a contractor:
 *   - Generalist: holds B (with or without C-classes)
 *   - Skilled:    2+ C-classes, no B
 *   - Specialist: exactly 1 C-class, no B
 *
 * Unknown/empty → defaults to "specialist" (safest single-icon layout).
 */
export function deriveType(classifications: string[]): ContractorType {
  if (classifications.includes("B")) return "generalist";
  const cs = classifications.filter((c) => c !== "B");
  if (cs.length >= 2) return "skilled";
  return "specialist";
}

/**
 * Primary trade for subtitles / the Specialist number-hero color.
 * Prefers the first C-class; falls back to general for all-B cases.
 */
export function primaryTradeFor(classifications: string[]): TradeSlug {
  const firstC = classifications.find((c) => c !== "B");
  return firstC ? tradeFromClass(firstC) : "general";
}

/**
 * Resolves the ordered trade slugs shown on a trade-variant card.
 * - Specialist: [primaryTrade]
 * - Skilled:    classifications in order, mapped to unique trades
 * - Generalist: [general, ...top C-classes in order]
 */
export function cardTradeOrder(
  classifications: string[],
  type: ContractorType
): TradeSlug[] {
  const uniq: TradeSlug[] = [];
  const push = (t: TradeSlug) => {
    if (!uniq.includes(t)) uniq.push(t);
  };

  if (type === "generalist") {
    push("general");
    classifications.filter((c) => c !== "B").forEach((c) => push(tradeFromClass(c)));
  } else {
    classifications.forEach((c) => push(tradeFromClass(c)));
  }
  return uniq;
}

export const TYPE_LABEL: Record<ContractorType, string> = {
  specialist: "Specialist",
  skilled: "Skilled",
  generalist: "Generalist",
};
