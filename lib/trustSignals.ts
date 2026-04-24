/**
 * Trust / compliance display logic for cards, map markers, and detail pages.
 *
 * Supabase `contractors` columns (see repo `schema.sql` — no invented fields):
 *
 * - `business_type` — CSLB `BusinessType` code from MasterLicenseData.csv
 *   (e.g. `SO`, `LLC`, `CR`, `PT`, `JV`). Pipeline stores the raw code; this
 *   module treats that as the ownership source of truth.
 * - `entity_type` — Optional friendly label from the same pipeline (e.g.
 *   "Sole Ownership"). Prefer for display when present; legacy rows may be null.
 * - `primary_status` — Normalized in Python: `Clear`, `Suspended`, `Inactive`,
 *   `Expired`, `Revoked`, `Cancelled`, or occasional passthrough title case.
 * - `suspension_reason` — Mapped human string when CSLB raw status matches a
 *   known suspension code; otherwise null.
 * - `has_workers_comp` — True only when `workers_comp_coverage_type` is one of
 *   the active coverage buckets (insurance / self-insured / leasing firm, etc.).
 * - `workers_comp_coverage_type` — Raw CSLB string (e.g. `Exempt`, `Workers'
 *   Compensation Insurance`). No separate WC expiration column in our schema.
 * - `has_contractor_bond` — Boolean only; no `bond_status` or bond expiry column.
 * - `is_active` — Pipeline sets this when `primary_status === "Clear"`.
 */

import type { Contractor } from "@/types/contractor";

export type TrustTone = "positive" | "neutral" | "warning" | "danger";

/** Shape required by the trust badge row (search select + card adapters). */
export type TrustBadgeContractor = Pick<
  Contractor,
  | "is_active"
  | "primary_status"
  | "suspension_reason"
  | "business_type"
  | "has_workers_comp"
  | "workers_comp_coverage_type"
  | "has_contractor_bond"
  | "has_pending_suspension"
  | "has_disciplinary_history"
>;

/** Raw CSLB business type code or null. */
export function getBusinessType(
  c: Pick<Contractor, "business_type">
): string | null {
  const v = c.business_type?.trim();
  return v && v.length > 0 ? v : null;
}

/**
 * Sole ownership in CSLB data is encoded as business type `SO`.
 * Rarely, expanded text may appear — handle both.
 */
export function isSoleOwnership(
  c: Pick<Contractor, "business_type">
): boolean {
  const raw = (c.business_type ?? "").trim();
  if (!raw) return false;
  const upper = raw.toUpperCase();
  if (upper === "SO") return true;
  if (upper === "SOLE OWNERSHIP") return true;
  if (/\bSOLE\b/i.test(raw) && /\bOWNER/i.test(raw)) return true;
  return false;
}

/** Owner-operated for UX: same as sole ownership for public-license data. */
export function isOwnerOperated(
  c: Pick<Contractor, "business_type">
): boolean {
  return isSoleOwnership(c);
}

/**
 * Search cards only: muted chip for sole proprietors.
 * LLC / Corp / Partnership / JV — no chip (detail page shows full entity type).
 */
export function getOwnershipChipForSearchCard(
  c: Pick<Contractor, "business_type">
): "Owner-Operated" | null {
  return isOwnerOperated(c) ? "Owner-Operated" : null;
}

const ENTITY_CODE_LABELS: Record<string, string> = {
  SO: "Sole Ownership",
  PT: "Partnership",
  CR: "Corporation",
  LLC: "Limited Liability Company",
  JV: "Joint Venture",
  "SOLE OWNERSHIP": "Sole Ownership",
  PARTNERSHIP: "Partnership",
  CORPORATION: "Corporation",
  "LIMITED LIABILITY COMPANY": "Limited Liability Company",
  "JOINT VENTURE": "Joint Venture",
};

/** Friendly entity label for detail / metadata. */
export function getEntityTypeLabel(
  c: Pick<Contractor, "business_type" | "entity_type">
): string {
  const et = c.entity_type?.trim();
  if (et) return et;
  const code = getBusinessType(c);
  if (!code) return "Unknown";
  const mapped = ENTITY_CODE_LABELS[code.toUpperCase()];
  if (mapped) return mapped;
  return ENTITY_CODE_LABELS[code] ?? code;
}

export type WorkersCompTrustKind = "covered" | "sole_exempt" | "missing";

export function getWorkersCompTrustKind(
  c: Pick<Contractor, "has_workers_comp" | "business_type">
): WorkersCompTrustKind {
  if (c.has_workers_comp) return "covered";
  if (isSoleOwnership(c)) return "sole_exempt";
  return "missing";
}

export interface WorkersCompBadgeModel {
  kind: WorkersCompTrustKind;
  label: string;
  tone: TrustTone;
  title: string;
}

/** Workers' comp strip: covered → green; sole → neutral exempt; else amber. */
export function getWorkersCompBadge(
  c: Pick<
    Contractor,
    "has_workers_comp" | "business_type" | "workers_comp_coverage_type"
  >
): WorkersCompBadgeModel {
  const kind = getWorkersCompTrustKind(c);
  const wcType = c.workers_comp_coverage_type?.trim();

  if (kind === "covered") {
    return {
      kind,
      label: "Workers' Comp",
      tone: "positive",
      title: wcType
        ? `Workers' compensation on file (${wcType})`
        : "Workers' compensation insurance on file",
    };
  }

  if (kind === "sole_exempt") {
    return {
      kind,
      label: "Workers' Comp Exempt",
      tone: "neutral",
      title:
        "Sole ownership licenses are typically exempt from employee workers' " +
        "compensation requirements when there are no employees. " +
        (wcType ? `CSLB record: ${wcType}.` : "Verify hiring practices on the official record."),
    };
  }

  return {
    kind,
    label: "Workers' Comp Missing",
    tone: "warning",
    title: wcType
      ? `No active workers' compensation on file (record: ${wcType}).`
      : "No active workers' compensation insurance on file for employees.",
  };
}

export interface LicenseTrustBadgeModel {
  label: string;
  tone: TrustTone;
  title?: string;
}

/**
 * License row on cards: consumer-friendly label; tone from CSLB primary_status.
 * `suspension_reason` is surfaced in title for tooltips, not inline on cards.
 */
export function getLicenseTrustBadge(
  c: Pick<
    Contractor,
    "is_active" | "primary_status" | "suspension_reason"
  >
): LicenseTrustBadgeModel {
  const status = (c.primary_status ?? "").trim();
  const st = status.toLowerCase();

  // Adverse statuses first (pipeline + raw CSLB text).
  if (st.includes("suspend")) {
    return {
      label: "Suspended",
      tone: "danger",
      title: c.suspension_reason ?? (status || "License suspended"),
    };
  }

  if (st.includes("revok")) {
    return {
      label: "Revoked",
      tone: "danger",
      title: c.suspension_reason ?? status,
    };
  }

  if (st.includes("inact") || status === "Inactive") {
    return {
      label: "Inactive",
      tone: "warning",
      title: status,
    };
  }

  if (st.includes("expir") || status === "Expired") {
    return {
      label: "Expired",
      tone: "warning",
      title: status,
    };
  }

  if (st.includes("cancel")) {
    return {
      label: "Cancelled",
      tone: "warning",
      title: status,
    };
  }

  // CSLB pipeline uses `Clear`; mocks may use `Active`.
  if (
    status === "Clear" ||
    st === "active" ||
    (c.is_active && !status)
  ) {
    return {
      label: "Active",
      tone: "positive",
      title:
        status === "Clear"
          ? "License in good standing (CSLB: Clear)"
          : "License in good standing",
    };
  }

  if (c.is_active) {
    return {
      label: "Active",
      tone: "positive",
      title: status ? `CSLB status: ${status}` : undefined,
    };
  }

  return {
    label: "License inactive",
    tone: "danger",
    title: status || "License is not active",
  };
}

/**
 * Map popup / cluster issue dot: true when something warrants attention.
 * Sole proprietors without WC are not flagged (exempt path).
 */
export function contractorMapTrustIssue(
  c: Pick<
    Contractor,
    | "is_active"
    | "has_workers_comp"
    | "has_contractor_bond"
    | "has_disciplinary_history"
    | "has_pending_suspension"
    | "business_type"
    | "primary_status"
    | "suspension_reason"
  >
): boolean {
  if (getLicenseTrustBadge(c).tone !== "positive") return true;
  if (c.has_disciplinary_history) return true;
  if (c.has_pending_suspension) return true;
  if (getWorkersCompTrustKind(c) === "missing") return true;
  if (!c.has_contractor_bond) return true;
  return false;
}

/** Bond row for trust strip (boolean-only in DB). */
export function getBondBadge(c: Pick<Contractor, "has_contractor_bond">): {
  label: string;
  tone: TrustTone;
  title: string;
} {
  if (c.has_contractor_bond) {
    return {
      label: "Bonded",
      tone: "positive",
      title: "Contractor license bond on file",
    };
  }
  return {
    label: "No bond on file",
    tone: "warning",
    title: "No contractor license bond on file",
  };
}

/** Long-form copy for detail / profile metadata (no HTML). */
export function getWorkersCompDetailSummary(
  c: Pick<
    Contractor,
    "has_workers_comp" | "business_type" | "workers_comp_coverage_type"
  >
): string {
  return getWorkersCompBadge(c).title;
}

export function getBondDetailSummary(
  c: Pick<Contractor, "has_contractor_bond">
): string {
  return getBondBadge(c).title;
}

/** Alias — search cards only (sole proprietors). */
export const getOwnershipChip = getOwnershipChipForSearchCard;

/** Alias — WC trust bucket for filters / analytics. */
export const getWorkersCompStatus = getWorkersCompTrustKind;

/** Alias — license row model for badges and summaries. */
export const getLicenseStatus = getLicenseTrustBadge;
