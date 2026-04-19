import type { Contractor } from "@/types/contractor";

/** Format ISO date (YYYY-MM-DD) into a human-readable string. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a US phone number from digits. Falls back to the raw value. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value;
}

/** One-word status bucket for color-coding a badge. */
export type StatusKind = "active" | "warning" | "inactive" | "unknown";

export function statusKind(c: Pick<Contractor, "is_active" | "primary_status" | "has_pending_suspension" | "expires_soon_90d">): StatusKind {
  if (!c.is_active) return "inactive";
  if (c.has_pending_suspension) return "warning";
  if (c.expires_soon_90d) return "warning";
  const s = (c.primary_status || "").toLowerCase();
  if (s.includes("suspend") || s.includes("revok") || s.includes("expired")) {
    return "inactive";
  }
  return "active";
}

export function statusLabel(
  c: Pick<Contractor, "is_active" | "primary_status" | "has_pending_suspension" | "expires_soon_90d">
): string {
  if (c.primary_status) return c.primary_status;
  if (c.is_active) return "Active";
  return "Inactive";
}

/** Compact "8 yrs" style. */
export function formatYears(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value < 1) return "<1 yr";
  return `${value} yr${value === 1 ? "" : "s"}`;
}

/** Build a compact "City, State ZIP" address line. */
export function formatCityStateZip(
  c: Pick<Contractor, "city" | "state" | "zip_code">
): string {
  const parts: string[] = [];
  if (c.city) parts.push(c.city);
  const tail = [c.state, c.zip_code].filter(Boolean).join(" ");
  const left = parts.join(", ");
  if (left && tail) return `${left}, ${tail}`;
  return left || tail || "—";
}
