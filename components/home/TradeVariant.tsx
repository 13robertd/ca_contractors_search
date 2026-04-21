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
 * All critical layout + sizing is inline-style driven so we don't rely
 * on Tailwind's JIT picking up arbitrary bracket utilities at build time.
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
  const shown: TradeSlug[] =
    trades.length > 0 ? trades.slice(0, MAX_SEGMENTS) : ["general"];
  const isCompact = size === "compact";

  // Canvas: pale trade tint for Specialist, warm cream otherwise.
  const primaryTint = TRADE_COLORS[c.primaryTrade]?.tint ?? "#F7F5F0";
  const canvasColor = c.type === "specialist" ? primaryTint : "#F7F5F0";

  // Number-hero color: primary trade color for Specialist; neutral for others.
  const heroColor =
    c.type === "specialist"
      ? TRADE_COLORS[c.primaryTrade]?.text ?? "#222222"
      : c.type === "generalist"
      ? TRADE_COLORS.general.text
      : "#222222";

  const barHeightPx = isCompact ? 5 : 6;
  const paddingPx = isCompact ? 8 : 10;
  const iconSizePx = isCompact ? 16 : 18;
  const heroNumPx = isCompact ? 44 : 52;
  const heroYrsPx = isCompact ? 11 : 13;
  const chipFontPx = isCompact ? 8 : 9;
  const chipPadV = isCompact ? 1 : 2;
  const chipPadH = isCompact ? 6 : 7;

  const yearsText =
    typeof c.yearsInBusiness === "number" && Number.isFinite(c.yearsInBusiness)
      ? String(c.yearsInBusiness)
      : "—";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: canvasColor,
      }}
    >
      {/* Top color bar */}
      <div
        aria-hidden
        style={{
          display: "flex",
          width: "100%",
          height: barHeightPx,
          flexShrink: 0,
        }}
      >
        {shown.map((t, i) => (
          <span
            key={`${t}-${i}`}
            style={{
              flex: 1,
              backgroundColor: TRADE_COLORS[t]?.bar ?? "#888780",
            }}
          />
        ))}
      </div>

      {/* Content area */}
      <div
        style={{
          position: "relative",
          flex: 1,
          padding: paddingPx,
        }}
      >
        {/* Top-left row: icons + type chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {shown.map((t, i) => {
              const Icon = TRADE_COLORS[t]?.icon;
              if (!Icon) return null;
              return (
                <Icon
                  key={`${t}-icon-${i}`}
                  size={iconSizePx}
                  strokeWidth={2}
                  style={{ color: TRADE_COLORS[t].text }}
                  aria-hidden
                />
              );
            })}
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.92)",
              color: "#222222",
              fontSize: chipFontPx,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              padding: `${chipPadV}px ${chipPadH}px`,
              lineHeight: 1.2,
            }}
          >
            {TYPE_LABEL[c.type]}
          </span>
        </div>

        {/* Bottom-right number hero */}
        <div
          style={{
            position: "absolute",
            bottom: paddingPx,
            right: paddingPx,
            display: "flex",
            alignItems: "baseline",
            gap: 3,
          }}
        >
          <span
            style={{
              color: heroColor,
              fontSize: heroNumPx,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            {yearsText}
          </span>
          <span
            style={{
              color: heroColor,
              fontSize: heroYrsPx,
              fontWeight: 500,
              opacity: 0.55,
            }}
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
  const labels = trades.map((t: TradeSlug) => TRADE_COLORS[t]?.label ?? "—");

  if (c.type === "specialist") return labels[0] ?? "—";

  if (c.type === "generalist") {
    const cClasses = labels.slice(1); // Strip the leading "General"
    if (cClasses.length === 0) return "General";
    if (cClasses.length <= 2) return `General · ${cClasses.join(" · ")}`;
    return `General + ${cClasses.length} more`;
  }

  // Skilled
  if (labels.length === 0) return "—";
  if (labels.length <= 3) return labels.join(" · ");
  const remaining = labels.length - 2;
  const compact = `${labels[0]} · ${labels[1]} + ${remaining} more`;
  const full = labels.join(" · ");
  return size === "compact" ? compact : full;
}
