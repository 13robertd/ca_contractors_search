/**
 * Geocoding Pass 2 — failed / missing-coordinate contractors only.
 *
 * Requires migration:
 *   supabase/migrations/0004_geocode_pass2_columns.sql
 *
 * Env (same as Pass 1):
 *   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY
 *   GEOCODE_CONTACT_EMAIL (recommended for Nominatim)
 *
 * Usage:
 *   npm run geocode:pass2
 *   npm run geocode:pass2:dry
 *   npm run geocode:pass2 -- --max=50
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { addressDedupeKeyFromLine } from "@/lib/geocode/normalizeAddress";
import type { AddressParts } from "@/lib/geocode/normalizeAddress";
import { normalizeAddressForGeocode } from "@/lib/geocode/normalizeAddress";
import { geocodeOneLineAddress } from "@/lib/geocode/orchestrate";
import {
  buildPass2Variants,
  looksLikePoBoxMailing,
} from "@/lib/geocode/pass2AddressVariants";
import type { GeocodeResult } from "@/lib/geocode/types";

type Row = {
  license_number: string;
  business_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geocode_precision: string | null;
  geocode_status: string | null;
  geocode_attempts: number | null;
};

type CsvRow = {
  id: string;
  business_name: string;
  original_address: string;
  retry_address_used: string;
  geocode_status: string;
  geocode_precision: string;
  geocode_source: string;
  geocode_notes: string;
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
      "Missing Supabase URL or service role key. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)."
    );
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run") || argv.includes("--dry");
  let batchSize = 100;
  let maxRows = Number.POSITIVE_INFINITY;
  for (const a of argv) {
    const m = /^--batch-size=(\d+)$/.exec(a);
    if (m) batchSize = Math.min(500, Math.max(1, Number(m[1])));
    const m2 = /^--max=(\d+)$/.exec(a);
    if (m2) maxRows = Math.max(1, Number(m2[1]));
  }
  return { dryRun, batchSize, maxRows };
}

function csvEscape(s: string): string {
  if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function classifyPass2Hit(
  res: GeocodeResult,
  poOriginal: boolean
): { outcome: "success" | "mailing_only"; precision: GeocodeResult["precision"] } | null {
  if (res.precision === "failed") return null;
  if (res.precision === "zip") return null;

  const strong =
    res.precision === "rooftop" ||
    res.precision === "street" ||
    res.precision === "interpolated";

  if (poOriginal) {
    if (strong) return null;
    if (res.precision === "city") {
      return { outcome: "mailing_only", precision: "city" };
    }
    return null;
  }

  if (strong || res.precision === "city") {
    return { outcome: "success", precision: res.precision };
  }
  return null;
}

async function main() {
  const argv = process.argv.slice(2);
  const { dryRun, batchSize, maxRows } = parseArgs(argv);
  const supabase = getServiceClient();

  let totalPending = 0;
  const { data: cnt, error: cntErr } = await supabase.rpc(
    "contractor_geocode_pass2_count"
  );
  if (cntErr) {
    console.warn(
      "contractor_geocode_pass2_count RPC missing — apply migration 0004. Progress will omit totals.\n",
      cntErr.message
    );
  } else if (typeof cnt === "number" && Number.isFinite(cnt)) {
    totalPending = cnt;
  } else if (cnt != null) {
    const n = Number(cnt);
    if (Number.isFinite(n)) totalPending = n;
  }

  const cache = new Map<string, GeocodeResult | "FAIL">();
  const csvRows: CsvRow[] = [];

  let cursor = "";
  let processed = 0;
  let recoveredSuccess = 0;
  let mailingOnly = 0;
  let stillFailed = 0;
  let dupHits = 0;
  let rooftopN = 0;
  let streetN = 0;
  let cityN = 0;

  const csvPath = path.join(process.cwd(), "geocode_pass2_results.csv");

  while (processed < maxRows) {
    const remaining = maxRows - processed;
    const limit = Math.min(batchSize, remaining);
    const { data, error } = await supabase.rpc(
      "contractors_geocode_pass2_fetch_batch",
      { p_after: cursor, p_limit: limit }
    );

    if (error) {
      console.error(
        "Fetch batch failed — apply migration 0004_geocode_pass2_columns.sql:",
        error.message
      );
      process.exit(1);
    }

    const rows = (data ?? []) as Row[];
    if (rows.length === 0) {
      console.log("\nNo more rows match Pass 2 selection criteria.");
      break;
    }

    for (const row of rows) {
      if (processed >= maxRows) break;

      processed++;
      const idxLabel =
        totalPending > 0 ? `${processed}/${totalPending}` : String(processed);

      const parts: AddressParts = {
        address: row.address,
        city: row.city,
        state: row.state,
        zip_code: row.zip_code,
      };
      const originalLine = normalizeAddressForGeocode(parts) ?? "";
      const poOriginal = looksLikePoBoxMailing(row.address);

      console.log(
        `\n[${idxLabel}] ${row.business_name}\n` +
          `  Original: ${originalLine || "(no normalizable address)"}`
      );

      if (!originalLine.trim()) {
        stillFailed++;
        const notes = "pass2: insufficient address fields";
        csvRows.push({
          id: row.license_number,
          business_name: row.business_name,
          original_address: "",
          retry_address_used: "",
          geocode_status: "failed_pass2",
          geocode_precision: "",
          geocode_source: "",
          geocode_notes: notes,
        });
        if (!dryRun) {
          const attempts = (row.geocode_attempts ?? 0) + 1;
          await supabase
            .from("contractors")
            .update({
              geocode_status: "failed_pass2",
              geocode_precision: null,
              latitude: null,
              longitude: null,
              geocode_source: null,
              geocode_notes: notes,
              normalized_address: null,
              geocode_pass: 2,
              geocode_attempts: attempts,
              geocoded_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("license_number", row.license_number);
        }
        console.log(`  Result: Failed\n  Notes: ${notes}`);
        continue;
      }

      if (dryRun) {
        const variants = buildPass2Variants(parts);
        console.log(
          `  (dry-run — ${variants.length} variant(s), no geocoder / no DB writes)`
        );
        for (const v of variants) {
          console.log(`    [${v.code}] ${v.line}${v.mailingOnlyContext ? " (PO context)" : ""}`);
        }
        continue;
      }

      const variants = buildPass2Variants(parts);
      let best: {
        res: GeocodeResult;
        line: string;
        variantCode: string;
        outcome: "success" | "mailing_only";
      } | null = null;

      for (const v of variants) {
        const key = addressDedupeKeyFromLine(v.line);
        let res: GeocodeResult | null = null;

        if (cache.has(key)) {
          const hit = cache.get(key)!;
          if (hit === "FAIL") {
            res = null;
          } else {
            res = hit;
            dupHits++;
            console.log(`  Cache hit for variant [${v.code}]`);
          }
        } else {
          res = await geocodeOneLineAddress(v.line, {
            contactEmail: process.env.GEOCODE_CONTACT_EMAIL,
          });
          cache.set(key, res ?? "FAIL");
        }

        if (!res) continue;

        const hit = classifyPass2Hit(res, poOriginal);
        if (!hit) continue;

        best = {
          res,
          line: v.line,
          variantCode: v.code,
          outcome: hit.outcome,
        };
        break;
      }

      const attempts = (row.geocode_attempts ?? 0) + 1;
      const now = new Date().toISOString();

      if (best) {
        const { res, line, variantCode, outcome } = best;
        const status = outcome === "mailing_only" ? "mailing_only" : "success";
        const notes = `pass2 variant ${variantCode}; ${res.source}; ${poOriginal ? "PO " : ""}${outcome}`;

        if (res.precision === "rooftop") rooftopN++;
        else if (res.precision === "street" || res.precision === "interpolated") {
          streetN++;
        } else if (res.precision === "city") {
          cityN++;
        }

        if (outcome === "mailing_only") mailingOnly++;
        else recoveredSuccess++;

        console.log(
          `  Retry used: ${line}\n` +
            `  Result: Success\n` +
            `  Precision: ${res.precision}\n` +
            `  Source: ${res.source}\n` +
            `  Status: ${status}`
        );

        csvRows.push({
          id: row.license_number,
          business_name: row.business_name,
          original_address: originalLine,
          retry_address_used: line,
          geocode_status: status,
          geocode_precision: res.precision,
          geocode_source: res.source,
          geocode_notes: notes,
        });

        const { error: upErr } = await supabase
          .from("contractors")
          .update({
            latitude: res.latitude,
            longitude: res.longitude,
            geocode_precision: res.precision,
            geocode_source: res.source,
            geocoded_at: now,
            geocode_status: status,
            geocode_attempts: attempts,
            geocode_notes: notes,
            normalized_address: line,
            geocode_pass: 2,
            updated_at: now,
          })
          .eq("license_number", row.license_number);

        if (upErr) {
          console.error("  DB update error:", upErr.message);
          stillFailed++;
          if (outcome === "mailing_only") mailingOnly--;
          else recoveredSuccess--;
          if (res.precision === "rooftop") rooftopN--;
          else if (
            res.precision === "street" ||
            res.precision === "interpolated"
          ) {
            streetN--;
          } else if (res.precision === "city") {
            cityN--;
          }
        }
      } else {
        stillFailed++;
        const notes = `pass2 exhausted ${variants.length} variant(s); no acceptable precision`;
        console.log(`  Result: Failed (pass2)\n  Notes: ${notes}`);

        csvRows.push({
          id: row.license_number,
          business_name: row.business_name,
          original_address: originalLine,
          retry_address_used: "",
          geocode_status: "failed_pass2",
          geocode_precision: "",
          geocode_source: "",
          geocode_notes: notes,
        });

        await supabase
          .from("contractors")
          .update({
            geocode_status: "failed_pass2",
            geocode_precision: null,
            latitude: null,
            longitude: null,
            geocode_source: null,
            geocode_notes: notes,
            normalized_address: null,
            geocode_pass: 2,
            geocode_attempts: attempts,
            geocoded_at: now,
            updated_at: now,
          })
          .eq("license_number", row.license_number);
      }
    }

    cursor = rows[rows.length - 1]!.license_number;
    if (rows.length < limit) break;
  }

  const header =
    "id,business_name,original_address,retry_address_used,geocode_status,geocode_precision,geocode_source,geocode_notes\n";
  const body = csvRows
    .map(
      (r) =>
        [
          csvEscape(r.id),
          csvEscape(r.business_name),
          csvEscape(r.original_address),
          csvEscape(r.retry_address_used),
          csvEscape(r.geocode_status),
          csvEscape(r.geocode_precision),
          csvEscape(r.geocode_source),
          csvEscape(r.geocode_notes),
        ].join(",") + "\n"
    )
    .join("");
  await writeFile(csvPath, header + body, "utf8");

  console.log(
    `\n========== Pass 2 Summary ==========\n` +
      `Processed: ${processed}\n` +
      `Recovered Success: ${recoveredSuccess}\n` +
      `Still Failed: ${stillFailed}\n` +
      `Mailing Only: ${mailingOnly}\n` +
      `City-level: ${cityN}\n` +
      `Street-level: ${streetN}\n` +
      `Rooftop: ${rooftopN}\n` +
      `Duplicate Cache Hits: ${dupHits}\n` +
      `\nWrote ${csvPath}\n`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
