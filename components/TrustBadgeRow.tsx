import {
  getBondBadge,
  getLicenseTrustBadge,
  getWorkersCompBadge,
  type TrustBadgeContractor,
  type TrustTone,
} from "@/lib/trustSignals";

export type { TrustBadgeContractor };

const TONE_CLS: Record<TrustTone, string> = {
  positive: "badge-positive",
  neutral: "badge-neutral",
  warning: "badge-warning",
  danger: "badge-danger",
};

interface BadgeProps {
  label: string;
  tone: TrustTone;
  title?: string;
  /** When set, overrides the default glyph for this tone. */
  glyph?: string;
}

function Badge({ label, tone, title, glyph }: BadgeProps) {
  const defaultGlyph =
    tone === "positive"
      ? "✓"
      : tone === "danger"
        ? "!"
        : tone === "warning"
          ? "⚠"
          : "–";
  const g = glyph ?? defaultGlyph;
  return (
    <span className={TONE_CLS[tone]} title={title ?? label}>
      <span className="font-semibold">{g}</span>
      {label}
    </span>
  );
}

/**
 * Full trust strip: license status from `primary_status`, workers' comp with
 * sole-proprietor exempt handling, bond, discipline, pending suspension.
 */
export default function TrustBadgeRow({
  contractor,
}: {
  contractor: TrustBadgeContractor;
}) {
  const license = getLicenseTrustBadge(contractor);
  const wc = getWorkersCompBadge(contractor);
  const bond = getBondBadge(contractor);

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        label={license.label}
        tone={license.tone}
        title={license.title}
      />

      <Badge label={wc.label} tone={wc.tone} title={wc.title} />

      <Badge label={bond.label} tone={bond.tone} title={bond.title} />

      {contractor.has_disciplinary_history ? (
        <Badge
          label="Discipline"
          tone="warning"
          glyph="!"
          title="Has disciplinary history"
        />
      ) : null}

      {contractor.has_pending_suspension ? (
        <Badge
          label="Pending Suspension"
          tone="danger"
          title="Has pending suspension"
        />
      ) : null}
    </div>
  );
}
