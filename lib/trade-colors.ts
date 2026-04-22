/**
 * Single source of truth for the VISUAL trade palette.
 *
 * Every surface that wants to speak "this is a plumber" — card border,
 * trade icon, classification dot, filter chip, detail-page header —
 * pulls from here. Keep it narrow and additive: a new trade means one
 * new row in TRADE_COLORS. Nothing else.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Schema note                                                 │
 * │   `border`     → used on non-left contexts (full outlines). │
 * │   `borderLeft` → used for the 4px trade bar on the card.    │
 * │                                                             │
 * │ Storing both as literal strings keeps the Tailwind JIT      │
 * │ happy — no dynamic class construction, no safelist needed.  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Keys are the full CSLB classification names so the same palette
 * works against both the long-form labels that come back from
 * Supabase and the short mock labels. `getTradeStyle` does partial
 * matching so variations ("C-36 Plumbing", "Plumbing Contractor") all
 * collapse to the same canonical style.
 */

import {
  Droplet,
  Zap,
  Home,
  Snowflake,
  Paintbrush,
  TreePine,
  Layers,
  Square,
  LayoutGrid,
  Hammer,
  HardHat,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type TradeStyle = {
  /** Full-border class, e.g. 'border-blue-500'. */
  border: string;
  /** Left-only border class, e.g. 'border-l-blue-500'. Used for the
   *  4px trade bar on the card so Tailwind sees the literal class. */
  borderLeft: string;
  /** Solid bg for the 8px classification dots. */
  dot: string;
  /** Darker text color for icons + chips-on-light. */
  text: string;
  /** Very light bg used by chips, classification pills, selected filter. */
  bg: string;
  icon: LucideIcon;
  /** Short, human display label. */
  label: string;
};

export const TRADE_COLORS: Record<string, TradeStyle> = {
  Plumbing: {
    border: "border-blue-500",
    borderLeft: "border-l-blue-500",
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    icon: Droplet,
    label: "Plumbing",
  },
  Electrical: {
    border: "border-yellow-500",
    borderLeft: "border-l-yellow-500",
    dot: "bg-yellow-500",
    text: "text-yellow-700",
    bg: "bg-yellow-50",
    icon: Zap,
    label: "Electrical",
  },
  Roofing: {
    border: "border-red-500",
    borderLeft: "border-l-red-500",
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    icon: Home,
    label: "Roofing",
  },
  "Warm-Air Heating, Ventilating and Air-Conditioning": {
    border: "border-orange-500",
    borderLeft: "border-l-orange-500",
    dot: "bg-orange-500",
    text: "text-orange-700",
    bg: "bg-orange-50",
    icon: Snowflake,
    label: "HVAC",
  },
  "Painting and Decorating": {
    border: "border-purple-500",
    borderLeft: "border-l-purple-500",
    dot: "bg-purple-500",
    text: "text-purple-700",
    bg: "bg-purple-50",
    icon: Paintbrush,
    label: "Painting",
  },
  Landscaping: {
    border: "border-green-500",
    borderLeft: "border-l-green-500",
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
    icon: TreePine,
    label: "Landscaping",
  },
  "Flooring and Floor Covering": {
    border: "border-amber-600",
    borderLeft: "border-l-amber-600",
    dot: "bg-amber-600",
    text: "text-amber-700",
    bg: "bg-amber-50",
    icon: Layers,
    label: "Flooring",
  },
  Concrete: {
    border: "border-zinc-500",
    borderLeft: "border-l-zinc-500",
    dot: "bg-zinc-500",
    text: "text-zinc-700",
    bg: "bg-zinc-50",
    icon: Square,
    label: "Concrete",
  },
  Drywall: {
    border: "border-neutral-500",
    borderLeft: "border-l-neutral-500",
    dot: "bg-neutral-500",
    text: "text-neutral-700",
    bg: "bg-neutral-50",
    icon: LayoutGrid,
    label: "Drywall",
  },
  "General Building": {
    border: "border-slate-500",
    borderLeft: "border-l-slate-500",
    dot: "bg-slate-500",
    text: "text-slate-700",
    bg: "bg-slate-50",
    icon: Hammer,
    label: "General Building",
  },
  "General Engineering": {
    border: "border-stone-500",
    borderLeft: "border-l-stone-500",
    dot: "bg-stone-500",
    text: "text-stone-700",
    bg: "bg-stone-50",
    icon: HardHat,
    label: "General Engineering",
  },
};

export const DEFAULT_TRADE: TradeStyle = {
  border: "border-gray-400",
  borderLeft: "border-l-gray-400",
  dot: "bg-gray-400",
  text: "text-gray-600",
  bg: "bg-gray-50",
  icon: Wrench,
  label: "Contractor",
};

/**
 * Resolve a trade name (short "HVAC", long "C-20 Warm-Air Heating…
 * Contractor", arbitrary CSLB label) to its visual style.
 *
 *   1. Exact key match on TRADE_COLORS.
 *   2. Case-insensitive match against any `.label` value — this is how
 *      short labels ("HVAC", "Painting") resolve to the long-named
 *      canonical keys.
 *   3. Case-insensitive substring match in either direction on keys
 *      ("C-36 Plumbing" → Plumbing, "general" → General Building).
 *   4. Fallback → DEFAULT_TRADE (wrench icon, gray).
 */
export function getTradeStyle(trade: string | null | undefined): TradeStyle {
  if (!trade) return DEFAULT_TRADE;
  if (TRADE_COLORS[trade]) return TRADE_COLORS[trade];

  const needle = trade.toLowerCase().trim();

  // Label match — short labels on taxonomy slugs ("HVAC", "Painting").
  for (const style of Object.values(TRADE_COLORS)) {
    if (style.label.toLowerCase() === needle) return style;
  }

  // Substring match on keys — handles "C-36 Plumbing", "general", etc.
  const hit = Object.keys(TRADE_COLORS).find((k) => {
    const key = k.toLowerCase();
    return needle.includes(key) || key.includes(needle);
  });
  return hit ? TRADE_COLORS[hit] : DEFAULT_TRADE;
}

/**
 * Hex fill colors aligned with Tailwind palette classes in TRADE_COLORS
 * (for Mapbox / canvas — map libs cannot consume Tailwind class strings).
 * Keys mirror `TRADE_COLORS` object keys.
 */
export const TRADE_HEX: Record<string, string> = {
  Plumbing: "#3b82f6", // blue-500
  Electrical: "#eab308", // yellow-500
  Roofing: "#ef4444", // red-500
  "Warm-Air Heating, Ventilating and Air-Conditioning": "#f97316", // orange-500
  "Painting and Decorating": "#a855f7", // purple-500
  Landscaping: "#22c55e", // green-500
  "Flooring and Floor Covering": "#d97706", // amber-600
  Concrete: "#71717a", // zinc-500
  Drywall: "#737373", // neutral-500
  "General Building": "#64748b", // slate-500
  "General Engineering": "#78716c", // stone-500
};

export const DEFAULT_TRADE_HEX = "#9ca3af"; // gray-400

/** Hex fill matching {@link getTradeStyle} resolution. */
export function getTradeHex(trade: string | null | undefined): string {
  if (!trade) return DEFAULT_TRADE_HEX;
  if (TRADE_HEX[trade]) return TRADE_HEX[trade];
  const resolved = getTradeStyle(trade);
  const key = Object.keys(TRADE_COLORS).find(
    (k) => TRADE_COLORS[k].label === resolved.label
  );
  if (key && TRADE_HEX[key]) return TRADE_HEX[key];
  const needle = trade.toLowerCase().trim();
  const hit = Object.keys(TRADE_HEX).find((k) => {
    const kk = k.toLowerCase();
    return needle.includes(kk) || kk.includes(needle);
  });
  return hit ? TRADE_HEX[hit] : DEFAULT_TRADE_HEX;
}

/**
 * Canonical `TRADE_COLORS` key for a raw `primary_trade` string (for
 * stable pin sprite ids). Falls back to the first label match or null.
 */
export function getTradePaletteKey(
  trade: string | null | undefined
): keyof typeof TRADE_COLORS | null {
  if (!trade) return null;
  if (TRADE_COLORS[trade]) return trade as keyof typeof TRADE_COLORS;
  const resolved = getTradeStyle(trade);
  const key = Object.keys(TRADE_COLORS).find(
    (k) => TRADE_COLORS[k].label === resolved.label
  ) as keyof typeof TRADE_COLORS | undefined;
  if (key) return key;
  const needle = trade.toLowerCase().trim();
  const hit = Object.keys(TRADE_COLORS).find((k) => {
    const kk = k.toLowerCase();
    return needle.includes(kk) || kk.includes(needle);
  }) as keyof typeof TRADE_COLORS | undefined;
  return hit ?? null;
}
