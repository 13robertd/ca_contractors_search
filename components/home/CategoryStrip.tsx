"use client";

import { Grid3x3, type LucideIcon } from "lucide-react";
import type { TradeSlug } from "@/lib/trades";
import { getTradeStyle, type TradeStyle } from "@/lib/trade-colors";

export type CategoryId = "all" | TradeSlug;

interface Category {
  id: CategoryId;
  label: string;
  /** Trade label used to look up the palette. `null` for "all". */
  tradeLabel: string | null;
}

/**
 * Trade-aware filter chips. Each chip draws its color from the same
 * palette as the contractor cards (lib/trade-colors.ts), so a blue
 * "Plumbers" chip teaches the user: blue = plumbing. Click it and the
 * card grid below is full of blue-bordered plumbing cards.
 *
 * Unselected → gray outline + a small colored dot and trade icon.
 * Selected   → filled in that trade's `.bg`, icon + label in `.text`.
 * "All"      → neutral gray (uses DEFAULT_TRADE); selected = gray fill.
 */
export const CATEGORIES: Category[] = [
  { id: "all",        label: "All",          tradeLabel: null         },
  { id: "plumbing",   label: "Plumbers",     tradeLabel: "Plumbing"   },
  { id: "electrical", label: "Electricians", tradeLabel: "Electrical" },
  { id: "roofing",    label: "Roofers",      tradeLabel: "Roofing"    },
  { id: "hvac",       label: "HVAC",         tradeLabel: "HVAC"       },
  { id: "painting",   label: "Painters",     tradeLabel: "Painting"   },
  { id: "general",    label: "General",      tradeLabel: "General Building" },
  { id: "landscape",  label: "Landscapers",  tradeLabel: "Landscaping" },
];

interface Props {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

export default function CategoryStrip({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Contractor categories"
      className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
    >
      {CATEGORIES.map((cat) => (
        <CategoryChip
          key={cat.id}
          cat={cat}
          isActive={cat.id === active}
          onClick={() => onChange(cat.id)}
        />
      ))}
    </div>
  );
}

function CategoryChip({
  cat,
  isActive,
  onClick,
}: {
  cat: Category;
  isActive: boolean;
  onClick: () => void;
}) {
  // "All" uses a fixed Grid3x3 icon; trades pull their icon from the
  // palette so chip visuals and card visuals always move together.
  const style = cat.tradeLabel ? getTradeStyle(cat.tradeLabel) : null;
  const Icon: LucideIcon = style?.icon ?? Grid3x3;

  const base =
    "shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors focus-brand";

  // Active chip — filled trade tint, icon + label in trade text.
  if (isActive && style) {
    return (
      <button
        type="button"
        role="tab"
        aria-selected
        onClick={onClick}
        className={`${base} ${style.bg} ${style.text} ring-1 ring-inset ring-transparent`}
      >
        <Icon size={16} strokeWidth={2.25} aria-hidden />
        <span>{cat.label}</span>
      </button>
    );
  }

  // Active "All" — neutral filled state (no trade color to draw on).
  if (isActive) {
    return (
      <button
        type="button"
        role="tab"
        aria-selected
        onClick={onClick}
        className={`${base} bg-ink-hero text-white`}
      >
        <Icon size={16} strokeWidth={2.25} aria-hidden />
        <span>{cat.label}</span>
      </button>
    );
  }

  // Unselected — gray outline, small colored dot + icon tinted by the
  // trade so the chip's identity is still visible at rest.
  return (
    <button
      type="button"
      role="tab"
      aria-selected={false}
      onClick={onClick}
      className={`${base} bg-white border border-gray-200 text-ink-hero hover:border-gray-300 hover:bg-gray-50`}
    >
      {style ? (
        <DotWithIcon style={style} Icon={Icon} />
      ) : (
        <Icon size={16} strokeWidth={2} className="text-ink-secondary" aria-hidden />
      )}
      <span>{cat.label}</span>
    </button>
  );
}

/**
 * Small colored dot + trade icon combo. The dot telegraphs the trade
 * color even when the chip itself is a neutral outline — so the
 * user picks up the color language before ever clicking.
 */
function DotWithIcon({
  style,
  Icon,
}: {
  style: TradeStyle;
  Icon: LucideIcon;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={`block w-1.5 h-1.5 rounded-full ${style.dot}`}
      />
      <Icon size={16} strokeWidth={2} className={style.text} aria-hidden />
    </span>
  );
}
