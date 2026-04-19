import type { Contractor } from "@/types/contractor";
import { statusKind, statusLabel } from "@/lib/formatters";

type Subset = Pick<
  Contractor,
  "is_active" | "primary_status" | "has_pending_suspension" | "expires_soon_90d"
>;

const STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  inactive: "bg-rose-50 text-rose-700 ring-rose-200",
  unknown: "bg-slate-50 text-slate-700 ring-slate-200",
};

const DOT: Record<string, string> = {
  active: "bg-emerald-500",
  warning: "bg-amber-500",
  inactive: "bg-rose-500",
  unknown: "bg-slate-400",
};

export default function StatusBadge({ contractor }: { contractor: Subset }) {
  const kind = statusKind(contractor);
  const label = statusLabel(contractor);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[kind]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[kind]}`} />
      {label}
    </span>
  );
}
