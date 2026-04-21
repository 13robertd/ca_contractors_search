import type { LicenseStatus, MockContractor } from "@/lib/mockContractors";

/**
 * Dark "credential tile" used as the top image area of every homepage
 * ContractorCard. No real photos — the public license data IS the hero.
 *
 * Presentational only: parent renders the heart overlay and carousel dots.
 */

interface Props {
  contractor: MockContractor;
}

const STATUS_STYLES: Record<
  LicenseStatus,
  { bg: string; dotBg: string; text: string; label: string }
> = {
  active: {
    bg: "bg-[rgba(16,185,129,0.15)]",
    dotBg: "bg-[#10B981]",
    text: "text-[#6EE7B7]",
    label: "ACTIVE",
  },
  expired: {
    bg: "bg-[rgba(234,179,8,0.15)]",
    dotBg: "bg-[#F59E0B]",
    text: "text-[#FCD34D]",
    label: "EXPIRED",
  },
  suspended: {
    bg: "bg-[rgba(185,28,28,0.2)]",
    dotBg: "bg-[#EF4444]",
    text: "text-[#FCA5A5]",
    label: "SUSPENDED",
  },
};

export default function LicenseCard({ contractor: c }: Props) {
  const status = STATUS_STYLES[c.status];

  const tags: string[] = [];
  if (c.bonded) tags.push("Bonded");
  if (c.workersComp) tags.push("Workers' comp");
  if (c.extraTags) tags.push(...c.extraTags);

  return (
    <div className="absolute inset-0 p-[18px] flex flex-col justify-between">
      {/* Top row: license number + status pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] font-medium uppercase tracking-[1px] text-white/55">
            CSLB License
          </div>
          <div className="mt-1 text-[17px] font-medium tracking-[1px] text-white font-mono truncate">
            #{c.licenseNumber}
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 h-[22px] pl-2 pr-2.5 rounded-full ${status.bg}`}
        >
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${status.dotBg}`}
          />
          <span
            className={`text-[10px] font-medium uppercase tracking-wider ${status.text}`}
          >
            {status.label}
          </span>
        </span>
      </div>

      {/* Bottom: meta fields + compliance tags */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-6">
          <MetaField label="CLASS" value={c.classificationLabel} />
          <MetaField label="ISSUED" value={String(c.issueYear)} />
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-[7px] py-[3px] rounded-[4px] text-[10px] leading-none bg-white/[0.08] text-white/90"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-medium uppercase tracking-[1px] text-white/55">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-medium text-white truncate">
        {value}
      </div>
    </div>
  );
}
