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
      className={`group relative bg-white rounded-lg border shadow-card transition-all duration-150 ${
        isHighlighted
          ? "border-ink shadow-card-hover -translate-y-0.5"
          : "border-line hover:border-line-strong hover:shadow-card-hover"
      }`}
    >
      {/* Full-card click target sits behind the interactive controls */}
      <Link
        href={href}
        aria-label={`Open ${l.business_name} details`}
        className="absolute inset-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      />

      <div className="relative p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-h3 text-ink truncate group-hover:underline underline-offset-2 decoration-ink/30">
              {l.business_name}
            </h3>
            <p className="mt-0.5 text-sm text-ink-muted truncate">
              {l.primary_trade || "General contractor"}
              {l.distanceLabel ? <> · <span>{l.distanceLabel}</span></> : null}
            </p>
          </div>
          <div className="flex items-start gap-2 shrink-0 relative z-10">
            <StatusBadge contractor={l} />
            <SaveContractorButton licenseNumber={l.license_number} variant="icon" />
          </div>
        </div>

        {/* Trust row */}
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
        <dl className="grid grid-cols-3 gap-4 text-sm pt-1">
          <Stat label="Years" value={formatYears(l.years_in_business)} />
          <Stat label="License" value={l.license_number} mono />
          <Stat
            label="Phone"
            value={
              l.phone ? (
                <a
                  href={`tel:${l.phone}`}
                  className="relative z-10 hover:text-ink"
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
      <dt className="text-[11px] uppercase tracking-wide font-medium text-ink-soft">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm text-ink font-medium truncate ${
          mono ? "tabular-nums" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
