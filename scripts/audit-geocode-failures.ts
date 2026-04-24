/**
 * Geocoding failure audit (read-only).
 *
 * Selects contractors where geocode_status = 'failed' OR latitude/longitude
 * are null, classifies heuristic failure patterns, writes:
 *   - geocode_failures.csv
 *   - geocode_failure_summary.json
 *   - geocode_failure_summary.txt
 *
 * Env: same as geocode script (node --env-file=.env.local in npm script).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyDuplicateStrangeCluster,
  buildDedupeKey,
  classifyGeocodeFailure,
  type FailurePattern,
} from "@/lib/geocode/auditFailurePatterns";
import { normalizeAddressForGeocode } from "@/lib/geocode/normalizeAddress";
import type { AddressParts } from "@/lib/geocode/normalizeAddress";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const OUT_DIR = resolve(__dirname, "..");

type DbRow = {
  license_number: string;
  business_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geocode_status: string | null;
  geocode_attempts: number | null;
  business_type: string | null;
  primary_trade: string | null;
};

type AuditRow = DbRow & {
  normalized_address: string;
  failure_pattern: FailurePattern;
  dedupe_key: string | null;
};

function getServiceClient(): SupabaseClient {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) {
    console.error(
      "Missing Supabase URL or service role key (see geocode-contractors.ts)."
    );
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function fetchAuditRows(supabase: SupabaseClient): Promise<DbRow[]> {
  const pageSize = 1000;
  const out: DbRow[] = [];
  let from = 0;
  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("contractors")
      .select(
        [
          "license_number",
          "business_name",
          "address",
          "city",
          "state",
          "zip_code",
          "latitude",
          "longitude",
          "geocode_status",
          "geocode_attempts",
          "business_type",
          "primary_trade",
        ].join(",")
      )
      .or("latitude.is.null,longitude.is.null,geocode_status.eq.failed")
      .order("license_number", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Supabase select failed:", error.message);
      process.exit(1);
    }
    const batch = (data ?? []) as unknown as DbRow[];
    if (batch.length === 0) break;
    out.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

function buildAuditRows(rows: DbRow[]): AuditRow[] {
  const partsList: AuditRow[] = rows.map((row) => {
    const parts: AddressParts = {
      address: row.address,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
    };
    const failure_pattern = classifyGeocodeFailure(parts, {
      geocode_status: row.geocode_status,
      geocode_attempts: row.geocode_attempts,
      latitude: row.latitude,
      longitude: row.longitude,
    });
    const normalized = normalizeAddressForGeocode(parts) ?? "";
    const dedupe_key = buildDedupeKey(parts);
    return {
      ...row,
      normalized_address: normalized,
      failure_pattern,
      dedupe_key,
    };
  });

  applyDuplicateStrangeCluster(partsList);
  return partsList;
}

function increment(
  map: Map<string, number>,
  key: string | null | undefined,
  delta = 1
) {
  const k = (key ?? "").trim() || "(blank)";
  map.set(k, (map.get(k) ?? 0) + delta);
}

function sortEntries(m: Map<string, number>): [string, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function summarize(rows: AuditRow[]) {
  const byCity = new Map<string, number>();
  const byZip = new Map<string, number>();
  const byPattern = new Map<string, number>();
  const byBusinessType = new Map<string, number>();
  const byTrade = new Map<string, number>();
  const examplesByPattern = new Map<string, string[]>();

  for (const r of rows) {
    increment(byCity, r.city);
    increment(byZip, r.zip_code);
    increment(byPattern, r.failure_pattern);
    increment(byBusinessType, r.business_type);
    increment(byTrade, r.primary_trade);
    const ex = examplesByPattern.get(r.failure_pattern) ?? [];
    if (ex.length < 8) {
      ex.push(r.license_number);
      examplesByPattern.set(r.failure_pattern, ex);
    }
  }

  return {
    total_rows: rows.length,
    by_city: Object.fromEntries(sortEntries(byCity)),
    by_zip: Object.fromEntries(sortEntries(byZip)),
    by_failure_pattern: Object.fromEntries(sortEntries(byPattern)),
    by_business_type: Object.fromEntries(sortEntries(byBusinessType)),
    by_primary_trade: Object.fromEntries(sortEntries(byTrade)),
    example_license_by_pattern: Object.fromEntries(
      [...examplesByPattern.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    ),
  };
}

async function writeCsv(path: string, rows: AuditRow[]) {
  // Required columns + failure_pattern for pivoting (audit-only).
  const header = [
    "id",
    "license_number",
    "business_name",
    "address",
    "city",
    "state",
    "zip",
    "normalized_address",
    "geocode_status",
    "geocode_attempts",
    "failure_pattern",
  ].join(",");

  const lines = rows.map((r, i) =>
    [
      csvEscape(i + 1),
      csvEscape(r.license_number),
      csvEscape(r.business_name),
      csvEscape(r.address),
      csvEscape(r.city),
      csvEscape(r.state),
      csvEscape(r.zip_code),
      csvEscape(r.normalized_address),
      csvEscape(r.geocode_status),
      csvEscape(r.geocode_attempts ?? 0),
      csvEscape(r.failure_pattern),
    ].join(",")
  );

  await writeFile(path, [header, ...lines].join("\n") + "\n", "utf8");
}

async function writeTextSummary(
  path: string,
  summary: ReturnType<typeof summarize>
) {
  const lines: string[] = [];
  lines.push("Geocode failure audit — summary");
  lines.push(`Total rows in audit: ${summary.total_rows}`);
  lines.push("");
  lines.push(
    "Pattern legend: see lib/geocode/auditFailurePatterns.ts (provider_or_unknown includes API/timeout/no-match)."
  );
  lines.push("");
  lines.push("Failure patterns (all):");
  for (const [k, v] of Object.entries(summary.by_failure_pattern)) {
    lines.push(`  ${k}: ${v}`);
  }
  lines.push("");
  lines.push("Sample license numbers per pattern (up to 8 each):");
  for (const [k, licenses] of Object.entries(
    summary.example_license_by_pattern
  )) {
    lines.push(`  ${k}: ${(licenses as string[]).join(", ")}`);
  }
  lines.push("");
  lines.push("Top 30 cities:");
  for (const [k, v] of Object.entries(summary.by_city).slice(0, 30)) {
    lines.push(`  ${k}: ${v}`);
  }
  lines.push("");
  lines.push("Top 30 ZIP codes:");
  for (const [k, v] of Object.entries(summary.by_zip).slice(0, 30)) {
    lines.push(`  ${k}: ${v}`);
  }
  lines.push("");
  lines.push("Top 25 business_type:");
  for (const [k, v] of Object.entries(summary.by_business_type).slice(0, 25)) {
    lines.push(`  ${k}: ${v}`);
  }
  lines.push("");
  lines.push("Top 25 primary_trade:");
  for (const [k, v] of Object.entries(summary.by_primary_trade).slice(0, 25)) {
    lines.push(`  ${k}: ${v}`);
  }
  lines.push("");
  await writeFile(path, lines.join("\n"), "utf8");
}

async function main() {
  const supabase = getServiceClient();
  console.log(
    "Fetching contractors where geocode_status = failed OR lat/lng null…"
  );
  const raw = await fetchAuditRows(supabase);
  console.log(`Rows in audit scope: ${raw.length}`);

  const rows = buildAuditRows(raw);
  const summary = summarize(rows);

  const csvPath = resolve(OUT_DIR, "geocode_failures.csv");
  const jsonPath = resolve(OUT_DIR, "geocode_failure_summary.json");
  const txtPath = resolve(OUT_DIR, "geocode_failure_summary.txt");

  await writeCsv(csvPath, rows);
  await writeFile(jsonPath, JSON.stringify(summary, null, 2), "utf8");
  await writeTextSummary(txtPath, summary);

  console.log("\nWrote:");
  console.log(`  ${csvPath}`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${txtPath}`);
  console.log("\nFailure patterns:");
  for (const [k, v] of Object.entries(summary.by_failure_pattern)) {
    console.log(`  ${k}: ${v}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
