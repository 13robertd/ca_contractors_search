import { getSupabase } from "./supabase";
import type { Contractor } from "@/types/contractor";
import { CONTRACTOR_CARD_COLUMNS } from "@/types/contractor";

/**
 * All Supabase queries live here. Edit this file to change search behavior.
 */

export interface SearchParams {
  location?: string;
  trade?: string;
  county?: string;
  primaryTrade?: string;
  activeOnly?: boolean;
  /** Minimum years in business. Ignored unless a positive integer. */
  minYears?: number;
  limit?: number;
}

/** Escape commas / parens inside a Supabase .or() term. */
function escapeOrValue(v: string): string {
  return v.replace(/,/g, "\\,").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Main contractor search. Kept intentionally simple:
 *   - location  => match city ILIKE or county ILIKE
 *   - trade     => match primary_trade ILIKE, any classification_labels ILIKE,
 *                  or search_blob ILIKE
 *   - activeOnly => is_active = true
 *   - county / primaryTrade => exact match filters
 */
export async function searchContractors(
  params: SearchParams
): Promise<Contractor[]> {
  const supabase = getSupabase();
  const {
    location,
    trade,
    county,
    primaryTrade,
    activeOnly = true,
    minYears,
    limit = 60,
  } = params;

  let query = supabase
    .from("contractors")
    .select(CONTRACTOR_CARD_COLUMNS)
    .order("years_in_business", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (activeOnly) query = query.eq("is_active", true);
  if (county) query = query.eq("county", county);
  if (primaryTrade) query = query.eq("primary_trade", primaryTrade);
  if (typeof minYears === "number" && Number.isFinite(minYears) && minYears > 0) {
    query = query.gte("years_in_business", minYears);
  }

  if (location && location.trim()) {
    const loc = escapeOrValue(location.trim());
    query = query.or(`city.ilike.%${loc}%,county.ilike.%${loc}%`);
  }

  if (trade && trade.trim()) {
    const t = escapeOrValue(trade.trim());
    // search_blob is pre-lowercased in the DB (see schema.sql) and already
    // contains business_name + city + all trade names, so a single ILIKE
    // against it also covers classification_labels matches case-insensitively.
    // We keep primary_trade as an extra OR term so short queries still rank.
    query = query.or(
      [`primary_trade.ilike.%${t}%`, `search_blob.ilike.%${t}%`].join(",")
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("searchContractors error:", error);
    throw error;
  }
  return (data ?? []) as unknown as Contractor[];
}

/** Fetch a single contractor by license number for the detail page. */
export async function getContractorByLicense(
  license: string
): Promise<Contractor | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contractors")
    .select("*")
    .eq("license_number", license)
    .maybeSingle();

  if (error) {
    console.error("getContractorByLicense error:", error);
    throw error;
  }
  return (data as Contractor) ?? null;
}

/** Fetch a batch of contractors by license numbers (for /saved). */
export async function getContractorsByLicenses(
  licenses: string[]
): Promise<Contractor[]> {
  if (licenses.length === 0) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contractors")
    .select(CONTRACTOR_CARD_COLUMNS)
    .in("license_number", licenses);

  if (error) {
    console.error("getContractorsByLicenses error:", error);
    throw error;
  }
  return (data ?? []) as unknown as Contractor[];
}

/** Distinct counties — used to populate the county filter dropdown. */
export async function getDistinctCounties(): Promise<string[]> {
  const supabase = getSupabase();
  // Supabase JS has no DISTINCT, so we page a capped list and dedupe client-side.
  const { data, error } = await supabase
    .from("contractors")
    .select("county")
    .not("county", "is", null)
    .limit(10000);

  if (error) {
    console.error("getDistinctCounties error:", error);
    return [];
  }
  const set = new Set<string>();
  (data ?? []).forEach((r: { county: string | null }) => {
    if (r.county) set.add(r.county);
  });
  return Array.from(set).sort();
}

/** Distinct primary trades — used to populate the trade filter dropdown. */
export async function getDistinctPrimaryTrades(): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contractors")
    .select("primary_trade")
    .not("primary_trade", "is", null)
    .limit(10000);

  if (error) {
    console.error("getDistinctPrimaryTrades error:", error);
    return [];
  }
  const set = new Set<string>();
  (data ?? []).forEach((r: { primary_trade: string | null }) => {
    if (r.primary_trade) set.add(r.primary_trade);
  });
  return Array.from(set).sort();
}
