"use client";

import Link from "next/link";
import SaveContractorButton from "@/components/SaveContractorButton";
import TrustBadgeRow from "@/components/TrustBadgeRow";
import { formatPhone, formatYears } from "@/lib/formatters";
import { getTradeStyle } from "@/lib/trade-colors";
import type { ContractorCardData } from "@/lib/cardData";

/**
 * ContractorCardBase — the one contractor card used everywhere.
 *
 * Color language (the "brand anchor" for each card):
 *
 *   • LEFT ACCENT is a 4px vertical strip (trade `.dot` bg) in a flex row,
 *     with `rounded-l-[12px]` so it follows the card corner — avoids the
 *     “square” misalignment of `border-l-4` against `rounded-[12px]`.
 *
 *   • TOP-LEFT ICON uses the same primary trade color (lucide icon,
 *     20px, tinted via `trade.text`). Paired with the border so the
 *     two visual anchors read as one signal.
 *
 *   • CLASSIFICATION DOTS (under the trade icon) appear when the card
 *     shows two or more service tags — each dot is a non-primary trade
 *     color (max 4 + "+N"). Single-trade cards stay clean (no column).
 *
 * Trust: on the `detailed` variant, <TrustBadgeRow> uses `lib/trustSignals`
 * (license from `primary_status`, WC with sole-proprietor exempt handling,
 * bond, discipline / pending suspension). Optional `ownershipChip` for
 * sole ownership. Matches /search.
 *
 * Density:
 *
 *   variant="preview"   Compact meta line only; no service-tag row or
 *                       trust strip (prefer `ContractorCard` default
 *                       detailed for homepage sections).
 *
 *   variant="detailed"  Trust badges + service-tag row + YEARS /
 *                       LICENSE / PHONE footer.
 */

type Variant = "preview" | "detailed";

interface Props {
  data: ContractorCardData;
  variant?: Variant;
  /** Parents own selection; card just renders the ring. */
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
  className?: string;
  /**
   * Use on homepage grids / horizontal rails: card fills the stretched cell
   * (`h-full`) and the YEARS/LICENSE/PHONE row pins to the bottom so every
   * card in a row matches the tallest contractor’s height.
   */
  fillGridCell?: boolean;
}

export default function ContractorCardBase({
  data,
  variant = "detailed",
  isHighlighted = false,
  onHover,
  className = "",
  fillGridCell = false,
}: Props) {
  const href = `/contractor/${encodeURIComponent(data.licenseNumber)}`;
  const trade = getTradeStyle(data.primaryTradeLabel);
  const TradeIcon = trade.icon;

  // Vertical dots: any multi-trade card (≥2 tags). The old ≥4 threshold
  // hid secondary trade colors for typical 2–3 classification contractors.
  const showDots = data.serviceTags.length >= 2;

  // Outer shell: flex row so the trade accent is a real column with
  // rounded left corners (not a border-l square). Padding lives only on
  // the inner column so the accent stays flush to the card edge.
  const shell = [
    "group relative flex flex-row overflow-hidden rounded-[12px] bg-white transition-all duration-150",
    "border border-gray-200",
    fillGridCell ? "h-full" : "",
    isHighlighted
      ? "shadow-[inset_0_0_0_1.5px_theme(colors.accent.DEFAULT),0_4px_14px_rgba(79,124,172,0.15)]"
      : "hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
    className,
  ].join(" ");

  const innerPad = variant === "preview" ? "p-5 sm:p-6" : "p-6";

  return (
    <article
      data-license={data.licenseNumber}
      onMouseEnter={onHover ? () => onHover(data.licenseNumber) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      className={shell}
    >
      {/* Full-card click target behind interactive controls */}
      <Link
        href={href}
        aria-label={`Open ${data.businessName} details`}
        className="absolute inset-0 z-0 rounded-[12px] focus-brand"
      />

      {/* Trade color strip — rounded with card; pointer-events-none so
          the overlay link still receives clicks. */}
      <div
        aria-hidden
        className={`pointer-events-none relative z-[1] w-1 shrink-0 self-stretch ${trade.dot} rounded-l-[12px]`}
      />

      <div
        className={[
          "relative z-[1] min-w-0 flex-1 flex flex-col",
          fillGridCell ? "h-full min-h-0" : "",
          innerPad,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {fillGridCell && variant === "detailed" ? (
          <>
            <div className="relative flex min-h-0 flex-1 gap-3">
              <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                <TradeIcon
                  size={20}
                  strokeWidth={2}
                  className={trade.text}
                  aria-hidden
                />
                {showDots ? (
                  <OverflowDots
                    tags={data.serviceTags}
                    primaryLabel={data.primaryTradeLabel}
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 flex flex-col gap-3.5 min-h-0">
                <Header data={data} />
                {data.ownershipChip ? (
                  <p className="text-[11px] font-medium leading-none">
                    <span
                      className="inline-flex items-center rounded-md border border-gray-200/90 bg-gray-50 px-2 py-1 text-ink-secondary"
                      title="Sole ownership — typically owner-operated"
                    >
                      {data.ownershipChip}
                    </span>
                  </p>
                ) : null}
                <TrustBadgeRow contractor={data.trustBadge} />
                {data.serviceTags.length > 0 ? (
                  <ServiceTagsRow tags={data.serviceTags} />
                ) : null}
              </div>
            </div>

            <div className="shrink-0 mt-auto pt-1">
              <MetaRow data={data} />
            </div>
          </>
        ) : (
          <div className="relative flex gap-3">
            <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
              <TradeIcon
                size={20}
                strokeWidth={2}
                className={trade.text}
                aria-hidden
              />
              {showDots ? (
                <OverflowDots
                  tags={data.serviceTags}
                  primaryLabel={data.primaryTradeLabel}
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1 flex flex-col gap-3.5">
              <Header data={data} />

              {variant === "detailed" ? (
                <>
                  {data.ownershipChip ? (
                    <p className="text-[11px] font-medium leading-none">
                      <span
                        className="inline-flex items-center rounded-md border border-gray-200/90 bg-gray-50 px-2 py-1 text-ink-secondary"
                        title="Sole ownership — typically owner-operated"
                      >
                        {data.ownershipChip}
                      </span>
                    </p>
                  ) : null}
                  <TrustBadgeRow contractor={data.trustBadge} />
                  {data.serviceTags.length > 0 ? (
                    <ServiceTagsRow tags={data.serviceTags} />
                  ) : null}
                  <MetaRow data={data} />
                </>
              ) : (
                <PreviewMeta data={data} />
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ---------- Classification dot overflow ---------- */

/**
 * Shows up to 4 colored dots for the contractor's NON-primary trades,
 * then a "+N" for anything else. Dedupes by trade style so two
 * classifications that collapse to the same trade (e.g. two HVAC
 * sub-classes) don't double up.
 */
function OverflowDots({
  tags,
  primaryLabel,
}: {
  tags: string[];
  primaryLabel: string;
}) {
  const MAX = 4;
  const primaryStyle = getTradeStyle(primaryLabel);

  // Dedupe by resolved style label so near-duplicate CSLB classes fold.
  const seen = new Set<string>([primaryStyle.label]);
  const uniqueOthers: { key: string; dot: string }[] = [];
  for (const tag of tags) {
    const style = getTradeStyle(tag);
    if (seen.has(style.label)) continue;
    seen.add(style.label);
    uniqueOthers.push({ key: tag, dot: style.dot });
  }

  if (uniqueOthers.length === 0) return null;

  const shown = uniqueOthers.slice(0, MAX);
  const extra = uniqueOthers.length - shown.length;

  return (
    <div className="flex flex-col items-center gap-1" aria-hidden>
      {shown.map((d) => (
        <span
          key={d.key}
          className={`block w-2 h-2 rounded-full ${d.dot}`}
        />
      ))}
      {extra > 0 ? (
        <span className="text-[10px] font-medium text-ink-soft leading-none">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

/* ---------- Sub-sections ---------- */

function Header({ data }: { data: ContractorCardData }) {
  // "Primary Trade · City" — primary label resolves upstream (see
  // adaptCommon) to "Multi-trade contractor" if there's no clear winner.
  const subheader = [data.primaryTradeLabel, data.city || null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-[16px] font-medium leading-tight text-ink-hero tracking-[-0.01em]">
          {data.businessName}
        </h3>
        {subheader ? (
          <p className="mt-0.5 truncate text-[13px] text-ink-secondary">
            {subheader}
          </p>
        ) : null}
      </div>
      <div className="relative z-10 shrink-0">
        <SaveContractorButton
          licenseNumber={data.licenseNumber}
          variant="icon"
        />
      </div>
    </div>
  );
}

function ServiceTagsRow({ tags }: { tags: string[] }) {
  // Cap at 6 so the row doesn't balloon; the detail page shows the full list.
  const MAX = 6;
  const shown = tags.slice(0, MAX);
  const extra = Math.max(0, tags.length - MAX);

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((t) => {
        const chipDot = getTradeStyle(t).dot;
        return (
          <span key={t} className="tag gap-1.5" title={t}>
            <span
              className={`shrink-0 w-1.5 h-1.5 rounded-full ${chipDot}`}
              aria-hidden
            />
            {t}
          </span>
        );
      })}
      {extra > 0 ? <span className="tag">+{extra} more</span> : null}
    </div>
  );
}

function MetaRow({ data }: { data: ContractorCardData }) {
  return (
    <dl className="grid grid-cols-3 gap-x-6 gap-y-1 border-t border-line-subtle pt-3">
      <Meta label="Years" value={formatYears(data.yearsInBusiness)} />
      <Meta label="License" value={data.licenseNumber} mono />
      <Meta
        label="Phone"
        value={
          data.phone ? (
            <a
              href={`tel:${data.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 text-ink-hero hover:text-accent"
            >
              {formatPhone(data.phone)}
            </a>
          ) : (
            "—"
          )
        }
      />
    </dl>
  );
}

function PreviewMeta({ data }: { data: ContractorCardData }) {
  const parts: string[] = [];
  if (data.yearsInBusiness != null) {
    parts.push(`${formatYears(data.yearsInBusiness)} in business`);
  }
  parts.push(`License #${data.licenseNumber}`);
  return (
    <p className="text-[12px] text-ink-soft tabular-nums">{parts.join(" · ")}</p>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.06em] font-medium text-ink-tertiary">
        {label}
      </dt>
      <dd
        className={`mt-1 truncate text-[14px] font-semibold text-ink-hero ${
          mono ? "tabular-nums" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
