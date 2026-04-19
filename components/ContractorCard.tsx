import Link from "next/link";
import type { Contractor } from "@/types/contractor";
import { formatPhone, formatYears } from "@/lib/formatters";
import StatusBadge from "./StatusBadge";
import TrustBadgeRow from "./TrustBadgeRow";
import SaveContractorButton from "./SaveContractorButton";

export default function ContractorCard({ contractor }: { contractor: Contractor }) {
  const c = contractor;
  const href = `/contractor/${encodeURIComponent(c.license_number)}`;
  const location = [c.city, c.county ? `${c.county} County` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="card-interactive p-5 flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="block">
            <h3 className="text-base sm:text-lg font-semibold text-ink hover:text-brand-600 truncate">
              {c.business_name}
            </h3>
          </Link>
          <p className="mt-0.5 text-sm text-ink-muted truncate">
            {c.primary_trade || "General contractor"}
            {location ? <> · <span className="text-ink-subtle">{location}</span></> : null}
          </p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <StatusBadge contractor={c} />
          <SaveContractorButton licenseNumber={c.license_number} variant="icon" />
        </div>
      </header>

      <TrustBadgeRow contractor={c} />

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-ink-subtle">Years</dt>
          <dd className="font-medium text-ink">{formatYears(c.years_in_business)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-subtle">License #</dt>
          <dd className="font-medium text-ink truncate">{c.license_number}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-subtle">Phone</dt>
          <dd className="font-medium text-ink truncate">
            {c.phone ? (
              <a href={`tel:${c.phone}`} className="hover:text-brand-600">
                {formatPhone(c.phone)}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-2 pt-1">
        <Link href={href} className="btn-primary flex-1 sm:flex-none">
          View details
        </Link>
        <SaveContractorButton licenseNumber={c.license_number} />
      </div>
    </article>
  );
}
