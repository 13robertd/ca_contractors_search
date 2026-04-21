/**
 * Trade palette + taxonomy. Single source of truth.
 *
 * - `TRADE_COLORS` — the 8 trade slugs mapped to:
 *     bar:  saturated color for the 6px top color bar on trade-variant cards
 *     text: darker shade for icons and the number-hero
 *     tint: very pale wash used as the canvas for Specialist cards
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
 * NEVER use crimson (#B91C1C) here — that color is reserved for actions
 * (wordmark, CTA, search button, saved-heart). Trades must not collide
 * with it.
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

export interface TradeColor {
  /** Color used in the 6px top color bar (saturated). */
  bar: string;
  /** Color used for icons + number-hero (darker, AA-safe on light canvas). */
  text: string;
  /** Very pale wash used as Specialist card canvas. */
  tint: string;
  /** Short, human label for subtitles/chips. */
  label: string;
  /** lucide-react icon. */
  icon: LucideIcon;
}

export const TRADE_COLORS: Record<TradeSlug, TradeColor> = {
  plumbing: {
    bar: "#378ADD",
    text: "#0C447C",
    tint: "#E6F1FB",
    label: "Plumbing",
    icon: Droplet,
  },
  electrical: {
    bar: "#EF9F27",
    text: "#633806",
    tint: "#FDF2DF",
    label: "Electrical",
    icon: Zap,
  },
  hvac: {
    bar: "#1D9E75",
    text: "#0F6E56",
    tint: "#E0F2EB",
    label: "HVAC",
    icon: Snowflake,
  },
  roofing: {
    bar: "#D85A30",
    text: "#712B13",
    tint: "#FBE7DD",
    label: "Roofing",
    icon: Home,
  },
  painting: {
    bar: "#7F77DD",
    text: "#3C3489",
    tint: "#ECEAF8",
    label: "Painting",
    icon: PaintBucket,
  },
  landscape: {
    bar: "#97C459",
    text: "#27500A",
    tint: "#EDF5DF",
    label: "Landscape",
    icon: Trees,
  },
  flooring: {
    bar: "#D4537E",
    text: "#72243E",
    tint: "#FAE1EB",
    label: "Flooring",
    icon: Layers,
  },
  general: {
    bar: "#888780",
    text: "#2C2C2A",
    tint: "#EEEDEA",
    label: "General",
    icon: Briefcase,
  },
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
