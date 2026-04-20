import Link from "next/link";
import type { Contractor } from "@/types/contractor";
import { formatPhone, formatYears } from "@/lib/formatters";
import StatusBadge from "./StatusBadge";
import TrustBadgeRow from "./TrustBadgeRow";
import SaveContractorButton from "./SaveContractorButton";

interface Props {
  contractor: Contractor;
  /** Slim variant used on the saved page. */
  dense?: boolean;
}

export default function ContractorCard({ contractor, dense }: Props) {
  const c = contractor;
  const href = `/contractor/${encodeURIComponent(c.license_number)}`;
  const location = [c.city, c.county ? `${c.county} County` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="card-interactive group relative flex flex-col">
      {/* Full-card click target sits behind the interactive controls */}
      <Link
        href={href}
        aria-label={`Open ${c.business_name} details`}
        className="absolute inset-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      />

      <div className={`relative ${dense ? "p-4" : "p-5"} flex flex-col gap-4`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-h3 text-ink truncate group-hover:underline underline-offset-2 decoration-ink/30">
              {c.business_name}
            </h3>
            <p className="mt-0.5 text-sm text-ink-muted truncate">
              {c.primary_trade || "General contractor"}
              {location ? <> · <span>{location}</span></> : null}
            </p>
          </div>
          <div className="flex items-start gap-2 shrink-0 relative z-10">
            <StatusBadge contractor={c} />
            <SaveContractorButton licenseNumber={c.license_number} variant="icon" />
          </div>
        </div>

        {/* Trust row */}
        <TrustBadgeRow contractor={c} />

        {!dense ? (
          <dl className="grid grid-cols-3 gap-4 text-sm pt-1">
            <Stat label="Years" value={formatYears(c.years_in_business)} />
            <Stat label="License" value={c.license_number} mono />
            <Stat
              label="Phone"
              value={
                c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    className="relative z-10 hover:text-ink"
                  >
                    {formatPhone(c.phone)}
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </dl>
        ) : null}
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
