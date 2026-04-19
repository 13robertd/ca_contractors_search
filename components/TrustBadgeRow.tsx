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
}

const TONE_CLS: Record<Tone, string> = {
  positive: "badge-positive",
  neutral: "badge-neutral",
  warning: "badge-warning",
  danger: "badge-danger",
};

function Badge({ label, tone, title }: BadgeProps) {
  const glyph =
    tone === "positive" ? "✓" : tone === "danger" || tone === "warning" ? "!" : "–";
  return (
    <span className={TONE_CLS[tone]} title={title ?? label}>
      <span className="font-semibold">{glyph}</span>
      {label}
    </span>
  );
}

export default function TrustBadgeRow({ contractor }: { contractor: Subset }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        label="Active"
        tone={contractor.is_active ? "positive" : "neutral"}
        title="Currently active license"
      />
      <Badge
        label="Workers' Comp"
        tone={contractor.has_workers_comp ? "positive" : "neutral"}
        title="Workers' compensation insurance on file"
      />
      <Badge
        label="Bonded"
        tone={contractor.has_contractor_bond ? "positive" : "neutral"}
        title="Contractor bond on file"
      />
      {contractor.has_disciplinary_history ? (
        <Badge label="Discipline" tone="warning" title="Has disciplinary history" />
      ) : null}
      {contractor.has_pending_suspension ? (
        <Badge label="Pending Suspension" tone="danger" title="Has pending suspension" />
      ) : null}
    </div>
  );
}
