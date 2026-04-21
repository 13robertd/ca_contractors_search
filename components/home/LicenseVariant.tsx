import type { MockContractor, LicenseStatus } from "@/lib/mockContractors";
import type { CardSize } from "./ContractorCard";

/**
 * Inner content of the dark credential tile. Presentation-only; the
 * outer ContractorCard provides the Link wrapper and heart overlay.
 */
interface Props {
  contractor: MockContractor;
  size: CardSize;
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

function classificationLabel(codes: string[], size: CardSize): string {
  // Prefer the first non-B code for the CLASS field (Specialist/Skilled),
  // fall back to "B General Building" for all-B generalists.
  const primary = codes.find((c) => c !== "B") ?? codes[0] ?? "—";
  if (size === "compact") return primary;
  const human: Record<string, string> = {
    B: "B General Building",
    "C-10": "C-10 Electrical",
    "C-15": "C-15 Flooring",
    "C-20": "C-20 HVAC",
    "C-27": "C-27 Landscaping",
    "C-33": "C-33 Painting",
    "C-36": "C-36 Plumbing",
    "C-39": "C-39 Roofing",
  };
  return human[primary] ?? primary;
}

function complianceTags(c: MockContractor, size: CardSize): string[] {
  const tags: string[] = [];
  if (c.bonded) tags.push("Bonded");
  if (c.workersComp) tags.push(size === "compact" ? "WC" : "Workers' comp");
  if (c.extraTags) tags.push(...c.extraTags);
  return tags;
}

export default function LicenseVariant({ contractor: c, size }: Props) {
  const status = STATUS_STYLES[c.status];
  const tags = complianceTags(c, size);
  const isCompact = size === "compact";

  const padding = isCompact ? "p-[14px]" : "p-[18px]";
  const licenseSize = isCompact ? "text-[14px]" : "text-[17px]";
  const metaSize = isCompact ? "text-[11px]" : "text-[13px]";
  const issuedLabel = isCompact ? "EST." : "ISSUED";

  return (
    <div className={`absolute inset-0 ${padding} flex flex-col justify-between`}>
      {/* Top row: license number + status pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] font-medium uppercase tracking-[1px] text-white/55">
            CSLB License
          </div>
          <div
            className={`mt-1 ${licenseSize} font-medium tracking-[1px] text-white font-mono truncate`}
          >
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
          <MetaField
            label="CLASS"
            value={classificationLabel(c.classifications, size)}
            metaSize={metaSize}
          />
          <MetaField
            label={issuedLabel}
            value={c.issueDate.slice(0, 4)}
            metaSize={metaSize}
          />
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

function MetaField({
  label,
  value,
  metaSize,
}: {
  label: string;
  value: string;
  metaSize: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-medium uppercase tracking-[1px] text-white/55">
        {label}
      </div>
      <div className={`mt-1 ${metaSize} font-medium text-white truncate`}>
        {value}
      </div>
    </div>
  );
}
