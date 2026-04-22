import type { Contractor } from "@/types/contractor";

type Subset = Pick<
  Contractor,
  | "is_active"
  | "has_workers_comp"
  | "has_contractor_bond"
  | "has_pending_suspension"
  | "has_disciplinary_history"
>;

type Tone = "positive" | "neutral" | "warning" | "danger";

interface BadgeProps {
  label: string;
  tone: Tone;
  title?: string;
  /** When set, overrides the default glyph for this tone. */
  glyph?: string;
}

const TONE_CLS: Record<Tone, string> = {
  positive: "badge-positive",
  neutral: "badge-neutral",
  warning: "badge-warning",
  danger: "badge-danger",
};

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
 * Full trust strip for listing cards: green checks for good standing on
 * Active / Workers' Comp / Bonded, amber warnings when coverage is
 * missing, discipline called out, pending suspension as danger.
 */
export default function TrustBadgeRow({ contractor }: { contractor: Subset }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {contractor.is_active ? (
        <Badge label="Active" tone="positive" title="Currently active license" />
      ) : (
        <Badge
          label="License inactive"
          tone="danger"
          title="License is not active"
        />
      )}

      {contractor.has_workers_comp ? (
        <Badge
          label="Workers' Comp"
          tone="positive"
          title="Workers' compensation insurance on file"
        />
      ) : (
        <Badge
          label="No workers' comp"
          tone="warning"
          title="No workers' compensation on file"
        />
      )}

      {contractor.has_contractor_bond ? (
        <Badge
          label="Bonded"
          tone="positive"
          title="Contractor bond on file"
        />
      ) : (
        <Badge
          label="No bond on file"
          tone="warning"
          title="No contractor bond on file"
        />
      )}

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
