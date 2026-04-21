import type { MockContractor } from "@/lib/mockContractors";
import {
  cardTradeOrder,
  TRADE_COLORS,
  TYPE_LABEL,
  type TradeSlug,
} from "@/lib/trades";
import type { CardSize } from "./ContractorCard";

/**
 * Color-coded trade tile (Option C from the spec).
 *
 * Layout:
 *   [ 6px color bar, N equal segments, one per shown trade ]
 *   ┌ content area (relative)
 *   │  [icon row][type chip]        [heart]    ← ContractorCard overlay
 *   │
 *   │                               [years] yrs
 *   └
 *
 * Presentation-only; the outer ContractorCard owns the Link + heart.
 */

interface Props {
  contractor: MockContractor;
  size: CardSize;
}

const MAX_SEGMENTS = 3;

export default function TradeVariant({ contractor: c, size }: Props) {
  const trades = cardTradeOrder(c.classifications, c.type);
  const shown = trades.slice(0, MAX_SEGMENTS);
  const isCompact = size === "compact";

  // Canvas: pale trade tint for Specialist, warm cream otherwise.
  const canvasColor =
    c.type === "specialist" ? TRADE_COLORS[c.primaryTrade].tint : "#F7F5F0";

  // Number-hero color: primary trade color for Specialist; neutral for others.
  const heroColor =
    c.type === "specialist"
      ? TRADE_COLORS[c.primaryTrade].text
      : c.type === "generalist"
      ? TRADE_COLORS.general.text
      : "#222222";

  const barHeight = isCompact ? 5 : 6;
  const padding = isCompact ? "p-2" : "p-[10px]";
  const iconSize = isCompact ? 14 : 16;
  const heroNumSize = isCompact ? "text-[44px]" : "text-[52px]";
  const heroYrsSize = isCompact ? "text-[11px]" : "text-[13px]";
  const chipSize = isCompact ? "text-[8px] px-1.5 py-[1px]" : "text-[9px] px-[7px] py-[2px]";

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ backgroundColor: canvasColor }}
    >
      {/* Top color bar */}
      <div
        className="flex w-full shrink-0"
        style={{ height: `${barHeight}px` }}
        aria-hidden
      >
        {shown.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="flex-1"
            style={{ backgroundColor: TRADE_COLORS[t].bar }}
          />
        ))}
      </div>

      {/* Content area */}
      <div className={`relative flex-1 ${padding}`}>
        {/* Top-left row: icons + type chip */}
        <div className="flex items-center gap-2">
          <div className="flex items-center" style={{ gap: 5 }}>
            {shown.map((t, i) => {
              const Icon = TRADE_COLORS[t].icon;
              return (
                <Icon
                  key={`${t}-icon-${i}`}
                  size={iconSize}
                  strokeWidth={2}
                  style={{ color: TRADE_COLORS[t].text }}
                  aria-hidden
                />
              );
            })}
          </div>

          <span
            className={`inline-flex items-center rounded-full bg-white/[0.92] text-ink-hero font-medium uppercase tracking-[0.4px] ${chipSize}`}
          >
            {TYPE_LABEL[c.type]}
          </span>
        </div>

        {/* Bottom-right number hero */}
        <div className={`absolute ${isCompact ? "bottom-2 right-2" : "bottom-[10px] right-[10px]"} flex items-baseline gap-[3px]`}>
          <span
            className={`${heroNumSize} font-medium leading-none tracking-[-2px]`}
            style={{ color: heroColor }}
          >
            {c.yearsInBusiness}
          </span>
          <span
            className={`${heroYrsSize} font-medium opacity-55`}
            style={{ color: heroColor }}
          >
            yrs
          </span>
        </div>
      </div>
    </div>
  );
}

export function tradeSubtitle(
  c: MockContractor,
  size: CardSize
): string {
  const trades = cardTradeOrder(c.classifications, c.type);
  const labels = trades.map((t: TradeSlug) => TRADE_COLORS[t].label);

  if (c.type === "specialist") return labels[0] ?? "—";

  if (c.type === "generalist") {
    const cClasses = labels.slice(1); // Strip the leading "General"
    if (cClasses.length === 0) return "General";
    if (cClasses.length <= 2) return `General · ${cClasses.join(" · ")}`;
    return `General + ${cClasses.length} more`;
  }

  // Skilled
  if (labels.length <= 3) return labels.join(" · ");
  const remaining = labels.length - 2;
  const compact = `${labels[0]} · ${labels[1]} + ${remaining} more`;
  const full = labels.join(" · ");
  return size === "compact" ? compact : full;
}
