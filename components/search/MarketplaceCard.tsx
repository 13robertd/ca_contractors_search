"use client";

import Link from "next/link";
import type { ContractorListing } from "@/lib/listings";
import { formatPhone, formatYears } from "@/lib/formatters";
import StatusBadge from "@/components/StatusBadge";
import TrustBadgeRow from "@/components/TrustBadgeRow";
import ClassificationTags from "@/components/ClassificationTags";
import SaveContractorButton from "@/components/SaveContractorButton";

interface Props {
  listing: ContractorListing;
  isHighlighted?: boolean;
  onHover?: (licenseNumber: string | null) => void;
}

const CLASSIFICATION_PREVIEW = 4;

/**
 * Search results card. Visual tokens are aligned with the home page:
 *   - 12px radius, subtle line-subtle border, no shadow at rest
 *   - Title: 15px / 500 / ink-hero (homepage card title scale)
 *   - Subtitle: 13px / ink-secondary
 *   - Stat labels: 10px / uppercase / tracking-0.8px / ink-tertiary
 *   - Stat values: 14px / 500 / ink-hero
 *   - Hover: border darkens only (home pattern — no heavy shadows)
 *   - Focus/highlight: crimson brand ring (focus-brand token)
 */
export default function MarketplaceCard({
  listing: l,
  isHighlighted,
  onHover,
}: Props) {
  const href = `/contractor/${encodeURIComponent(l.license_number)}`;

  return (
    <article
      onMouseEnter={() => onHover?.(l.license_number)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(l.license_number)}
      onBlur={() => onHover?.(null)}
      className={`group relative rounded-[12px] bg-white transition-colors duration-150 ${
        isHighlighted
          ? "border border-brand ring-1 ring-brand/20"
          : "border border-line-subtle hover:border-line-strong"
      }`}
    >
      {/* Full-card click target behind interactive controls */}
      <Link
        href={href}
        aria-label={`Open ${l.business_name} details`}
        className="absolute inset-0 rounded-[12px] focus-brand"
      />

      <div className="relative p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-medium text-ink-hero truncate">
              {l.business_name}
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-secondary truncate">
              {l.primary_trade || "General contractor"}
              {l.distanceLabel ? <> · <span>{l.distanceLabel}</span></> : null}
            </p>
          </div>
          <div className="flex items-start gap-2 shrink-0 relative z-10">
            <StatusBadge contractor={l} />
            <SaveContractorButton
              licenseNumber={l.license_number}
              variant="icon"
            />
          </div>
        </div>

        {/* Trust row — semantic badges (badge-positive / badge-warning etc.
            are already the site-wide trust-signal tokens). */}
        <TrustBadgeRow contractor={l} />

        {/* Classifications (licenses held) */}
        {l.classification_labels && l.classification_labels.length > 0 ? (
          <ClassificationTags
            labels={l.classification_labels}
            max={CLASSIFICATION_PREVIEW}
            expandable
          />
        ) : null}

        {/* Stats */}
        <dl className="grid grid-cols-3 gap-4 pt-1">
          <Stat label="Years" value={formatYears(l.years_in_business)} />
          <Stat label="License" value={l.license_number} mono />
          <Stat
            label="Phone"
            value={
              l.phone ? (
                <a
                  href={`tel:${l.phone}`}
                  className="relative z-10 hover:text-brand transition-colors"
                >
                  {formatPhone(l.phone)}
                </a>
              ) : (
                "—"
              )
            }
          />
        </dl>
      </div>
    </article>
  );
}

function Stat({
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
      <dt className="text-[10px] uppercase tracking-[0.8px] font-medium text-ink-tertiary">
        {label}
      </dt>
      <dd
        className={`mt-1 text-[14px] text-ink-hero font-medium truncate ${
          mono ? "tabular-nums" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
