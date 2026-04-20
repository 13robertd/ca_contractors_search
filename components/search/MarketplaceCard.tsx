"use client";

import Link from "next/link";
import type { ContractorListing } from "@/lib/listings";
import SaveContractorButton from "@/components/SaveContractorButton";

interface Props {
  listing: ContractorListing;
  isHighlighted?: boolean;
  onHover?: (licenseNumber: string | null) => void;
  onSelect?: (licenseNumber: string) => void;
}

export default function MarketplaceCard({
  listing: l,
  isHighlighted,
  onHover,
  onSelect,
}: Props) {
  const href = `/contractor/${encodeURIComponent(l.license_number)}`;

  return (
    <article
      onMouseEnter={() => onHover?.(l.license_number)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(l.license_number)}
      onBlur={() => onHover?.(null)}
      onClick={() => onSelect?.(l.license_number)}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isHighlighted
          ? "border-ink shadow-card-hover -translate-y-0.5"
          : "border-line hover:shadow-card-hover hover:-translate-y-0.5"
      }`}
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <CoverArt hue={l.coverHue} businessName={l.business_name} />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {l.is_active ? (
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/95 backdrop-blur text-[11px] font-medium text-ink shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-positive-500" />
              Verified
            </span>
          ) : null}
          {l.has_disciplinary_history ? (
            <span className="inline-flex items-center h-6 px-2 rounded-full bg-warning-50/95 backdrop-blur text-[11px] font-medium text-warning-700 shadow-sm">
              Discipline
            </span>
          ) : null}
        </div>
        <div className="absolute top-2 right-2">
          <SaveContractorButton licenseNumber={l.license_number} variant="icon" />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-ink leading-tight line-clamp-1">
            {l.business_name}
          </h3>
          <div className="flex items-center gap-1 shrink-0 text-[13px] text-ink">
            <StarIcon />
            <span className="font-semibold tabular-nums">
              {l.rating.toFixed(1)}
            </span>
            <span className="text-ink-soft tabular-nums">
              ({l.reviewCount})
            </span>
          </div>
        </div>

        <p className="mt-1 text-[13px] text-ink-muted line-clamp-1">
          {l.primary_trade ?? "General contractor"}
        </p>

        {l.distanceLabel ? (
          <p className="mt-0.5 text-[12.5px] text-ink-soft line-clamp-1">
            {l.distanceLabel}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-1">
          {l.has_workers_comp ? <Tag>Workers&apos; comp</Tag> : null}
          {l.has_contractor_bond ? <Tag>Bonded</Tag> : null}
          {l.years_in_business && l.years_in_business >= 10 ? (
            <Tag>{l.years_in_business}+ yrs</Tag>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-[13px] text-ink">
            <span className="font-semibold tabular-nums">${l.hourlyRate}</span>
            <span className="text-ink-soft"> /hr starting</span>
          </div>
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-ink text-white text-xs font-medium hover:bg-fixd-hover transition-colors"
          >
            View profile
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CoverArt({ hue, businessName }: { hue: number; businessName: string }) {
  // Deterministic gradient cover so cards feel premium without real photos.
  const c1 = `hsl(${hue}, 38%, 32%)`;
  const c2 = `hsl(${(hue + 38) % 360}, 50%, 22%)`;
  const initial = businessName.trim().charAt(0).toUpperCase() || "F";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
      }}
      aria-hidden
    >
      <span className="text-white/85 text-5xl font-bold tracking-tight drop-shadow-sm select-none">
        {initial}
      </span>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center h-5 px-2 rounded-full bg-surface-subtle text-[11px] font-medium text-ink-muted">
      {children}
    </span>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-ink" fill="currentColor" aria-hidden>
      <path d="M10 1.7l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.96l-5.18 2.72.99-5.77L1.62 7.79l5.79-.84L10 1.7z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.58 10 7.3 5.7a1 1 0 0 1 0-1.4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
