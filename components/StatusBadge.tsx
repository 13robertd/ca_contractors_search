import type { Contractor } from "@/types/contractor";
import { statusKind, statusLabel } from "@/lib/formatters";

type Subset = Pick<
  Contractor,
  "is_active" | "primary_status" | "has_pending_suspension" | "expires_soon_90d"
>;

const KIND_TO_BADGE: Record<string, string> = {
  active: "badge-positive",
  warning: "badge-warning",
  inactive: "badge-danger",
  unknown: "badge-neutral",
};

const KIND_TO_DOT: Record<string, string> = {
  active: "bg-positive-500",
  warning: "bg-warning-500",
  inactive: "bg-danger-500",
  unknown: "bg-ink-soft",
};

export default function StatusBadge({ contractor }: { contractor: Subset }) {
  const kind = statusKind(contractor);
  const label = statusLabel(contractor);
  return (
    <span className={KIND_TO_BADGE[kind]}>
      <span className={`status-dot ${KIND_TO_DOT[kind]}`} />
      {label}
    </span>
  );
}
