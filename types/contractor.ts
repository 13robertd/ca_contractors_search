export interface Contractor {
  license_number: string;

  business_name: string;
  full_business_name: string | null;

  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  county: string | null;

  /** DB geocode pipeline — null until batch geocoder runs */
  latitude?: number | null;
  longitude?: number | null;
  geocode_precision?: string | null;
  geocode_source?: string | null;
  geocoded_at?: string | null;
  geocode_status?: string | null;
  geocode_attempts?: number | null;
  geocode_notes?: string | null;
  normalized_address?: string | null;
  geocode_pass?: number | null;

  phone: string | null;
  business_type: string | null;
  entity_type: string | null;
  owner_name: string | null;

  classification_codes: string[];
  classification_labels: string[];
  primary_trade: string | null;
  classification_count: number;
  has_multiple_classifications: boolean;

  primary_status: string | null;
  suspension_reason: string | null;
  is_active: boolean;
  expires_soon_90d: boolean;

  issue_date: string | null;
  expiration_date: string | null;
  years_in_business: number | null;
  last_update: string | null;

  has_workers_comp: boolean;
  workers_comp_coverage_type: string | null;
  has_contractor_bond: boolean;
  has_pending_suspension: boolean;
  has_disciplinary_history: boolean;

  search_blob: string | null;
}

/**
 * Columns required for the card/list view. Keep minimal for fast reads.
 * Any future homepage server fetch must use this same select (or `*`) so
 * trust badges match /search — includes is_active, has_workers_comp,
 * has_contractor_bond, has_disciplinary_history, has_pending_suspension.
 */
export const CONTRACTOR_CARD_COLUMNS = [
  "license_number",
  "business_name",
  "city",
  "county",
  "state",
  "phone",
  "primary_trade",
  "primary_status",
  "suspension_reason",
  "is_active",
  "years_in_business",
  "business_type",
  "has_workers_comp",
  "workers_comp_coverage_type",
  "has_contractor_bond",
  "has_pending_suspension",
  "has_disciplinary_history",
  // classification_codes drives trade-color resolution on the card
  // (left accent bar + trade chips). Cheap to fetch — text[].
  "classification_codes",
  "classification_labels",
  "latitude",
  "longitude",
  "geocode_precision",
  "geocode_status",
].join(",");
