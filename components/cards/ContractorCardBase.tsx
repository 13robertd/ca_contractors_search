"use client";

import Link from "next/link";
import { AlertTriangle, OctagonAlert } from "lucide-react";
import SaveContractorButton from "@/components/SaveContractorButton";
import { formatPhone, formatYears } from "@/lib/formatters";
import { getTradeStyle } from "@/lib/trade-colors";
import type { ContractorCardData, TrustFlags } from "@/lib/cardData";

/**
 * ContractorCardBase — the one contractor card used everywhere.
 *
 * Color language (the "brand anchor" for each card):
 *
 *   • LEFT BORDER is 4px solid in the PRIMARY TRADE COLOR.
 *     Always visible. One color per card — never split, never striped.
 *     Unknown trade → neutral gray (DEFAULT_TRADE).
 *
 *   • TOP-LEFT ICON uses the same primary trade color (lucide icon,
 *     20px, tinted via `trade.text`). Paired with the border so the
 *     two visual anchors read as one signal.
 *
 *   • CLASSIFICATION DOTS only appear when `classificationCount ≥ 4`.
 *     Max 4 visible + "+N" overflow. Each dot uses its own trade's
 *     color; primary-trade duplicates are filtered out. For 1-3
 *     classifications the card stays clean (no dots).
 *
 * Trust language (exception-based):
 *
 *   • Risk signals only appear when something is wrong (discipline,
 *     inactive, missing coverage). Clean contractor = no chips.
 *
 * Density:
 *
 *   variant="preview"   Homepage browse cards. Name, trade·city,
 *                       risk signals (if any), compact meta line.
 *                       No service-tag row, no metadata grid.
 *
 *   variant="detailed"  Search + saved cards. Adds the service-tag
 *                       row and the YEARS / LICENSE / PHONE footer.
 */

type Variant = "preview" | "detailed";

interface Props {
  data: ContractorCardData;
  variant?: Variant;
  /** Parents own selection; card just renders the ring. */
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
  className?: string;
}

export default function ContractorCardBase({
  data,
  variant = "detailed",
  isHighlighted = false,
  onHover,
  className = "",
}: Props) {
  const href = `/contractor/${encodeURIComponent(data.licenseNumber)}`;
  const signals = computeRiskSignals(data.trust);
  const trade = getTradeStyle(data.primaryTradeLabel);
  const TradeIcon = trade.icon;

  // Dots only appear when the contractor holds ≥4 classifications — the
  // threshold keeps specialists & 2-3 trade cards visually calm.
  const showDots = data.classificationCount >= 4;

  // Chrome: subtle gray-200 outline, thick colored left border, soft
  // corner radius. When selected we overlay an accent-blue inset ring
  // via box-shadow so the trade bar stays the dominant color anchor.
  const shell = [
    "group relative flex flex-col bg-white rounded-[12px] transition-all duration-150",
    "border border-gray-200 border-l-4",
    trade.borderLeft,
    variant === "preview" ? "p-5 sm:p-6" : "p-6",
    isHighlighted
      ? "shadow-[inset_0_0_0_1.5px_theme(colors.accent.DEFAULT),0_4px_14px_rgba(79,124,172,0.15)]"
      : "hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
    className,
  ].join(" ");

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
        className="absolute inset-0 rounded-[12px] focus-brand"
      />

      {/* Top row: trade-icon column on the left, save button on the right.
          The title + subtitle and everything below sits in the middle. */}
      <div className="relative flex gap-3">
        {/* Trade icon column — also hosts the overflow dot row. */}
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

          {signals.length > 0 ? <RiskSignals signals={signals} /> : null}

          {variant === "detailed" ? (
            <>
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

/* ---------- Risk signals (exception-based) ---------- */

type SignalTone = "warning" | "danger";
interface RiskSignal {
  key: string;
  label: string;
  tone: SignalTone;
}

function computeRiskSignals(trust: TrustFlags): RiskSignal[] {
  const signals: RiskSignal[] = [];
  if (trust.pendingSuspension) {
    signals.push({
      key: "suspension",
      label: "Pending suspension",
      tone: "danger",
    });
  }
  if (!trust.active) {
    signals.push({
      key: "inactive",
      label: "License inactive",
      tone: "danger",
    });
  }
  if (trust.discipline) {
    signals.push({
      key: "discipline",
      label: "Disciplinary history",
      tone: "warning",
    });
  }
  if (!trust.workersComp) {
    signals.push({
      key: "wc",
      label: "No workers' comp",
      tone: "warning",
    });
  }
  if (!trust.bonded) {
    signals.push({
      key: "bond",
      label: "No bond on file",
      tone: "warning",
    });
  }
  return signals;
}

function RiskSignals({ signals }: { signals: RiskSignal[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {signals.map((s) => (
        <span key={s.key} className={SIGNAL_CLS[s.tone]} title={s.label}>
          {s.tone === "danger" ? (
            <OctagonAlert size={11} strokeWidth={2.25} aria-hidden />
          ) : (
            <AlertTriangle size={11} strokeWidth={2.25} aria-hidden />
          )}
          {s.label}
        </span>
      ))}
    </div>
  );
}

const SIGNAL_CLS: Record<SignalTone, string> = {
  warning: "signal-warning",
  danger: "signal-danger",
};

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
      {shown.map((t) => (
        <span key={t} className="tag" title={t}>
          {t}
        </span>
      ))}
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
