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
    <article className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="block">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 hover:text-brand-700 truncate">
              {c.business_name}
            </h3>
          </Link>
          <p className="mt-0.5 text-sm text-slate-600 truncate">
            {c.primary_trade || "General contractor"}
            {location ? <> · <span className="text-slate-500">{location}</span></> : null}
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
          <dt className="text-xs text-slate-500">Years</dt>
          <dd className="font-medium text-slate-900">{formatYears(c.years_in_business)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">License #</dt>
          <dd className="font-medium text-slate-900 truncate">{c.license_number}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Phone</dt>
          <dd className="font-medium text-slate-900 truncate">
            {c.phone ? (
              <a href={`tel:${c.phone}`} className="hover:text-brand-700">
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
