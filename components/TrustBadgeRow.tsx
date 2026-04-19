import type { Contractor } from "@/types/contractor";

type Subset = Pick<
  Contractor,
  | "is_active"
  | "has_workers_comp"
  | "has_contractor_bond"
  | "has_pending_suspension"
  | "has_disciplinary_history"
>;

interface BadgeProps {
  label: string;
  ok: boolean;
  warn?: boolean;
  title?: string;
}

function Badge({ label, ok, warn, title }: BadgeProps) {
  const tone = warn
    ? "bg-brand-50 text-brand-700 ring-brand-200"
    : ok
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : "bg-surface-alt text-ink-subtle ring-hairline";
  const icon = warn ? "!" : ok ? "✓" : "–";
  return (
    <span
      title={title ?? label}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      <span className="font-bold">{icon}</span>
      {label}
    </span>
  );
}

export default function TrustBadgeRow({ contractor }: { contractor: Subset }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge label="Active" ok={!!contractor.is_active} title="Currently active license" />
      <Badge
        label="Workers' Comp"
        ok={!!contractor.has_workers_comp}
        title="Workers' compensation insurance on file"
      />
      <Badge
        label="Bonded"
        ok={!!contractor.has_contractor_bond}
        title="Contractor bond on file"
      />
      {contractor.has_disciplinary_history ? (
        <Badge label="Discipline" ok={false} warn title="Has disciplinary history" />
      ) : null}
      {contractor.has_pending_suspension ? (
        <Badge
          label="Pending Suspension"
          ok={false}
          warn
          title="Has pending suspension"
        />
      ) : null}
    </div>
  );
}
