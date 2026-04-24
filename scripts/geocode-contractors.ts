/**
 * Batch geocode contractors (Census → Nominatim), update Supabase.
 *
 * Env (either naming works for URL / service key):
 *   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY
 *
 * Optional:
 *   GEOCODE_CONTACT_EMAIL — Nominatim User-Agent contact (recommended)
 *
 * Run migration first:
 *   contractor-search-app/supabase/migrations/0003_contractors_geocode.sql
 *
 * Usage:
 *   npm run geocode
 *   npm run geocode:dry
 *   npm run geocode:stats
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { addressDedupeKey, normalizeAddressForGeocode } from "@/lib/geocode/normalizeAddress";
import type { AddressParts } from "@/lib/geocode/normalizeAddress";
import { geocodeAddressParts } from "@/lib/geocode/orchestrate";
import type { GeocodeResult } from "@/lib/geocode/types";

/** Env is loaded via `node --env-file=.env.local` in npm scripts (Node 20+). */

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
  const statsOnly = argv.includes("--stats") || argv.includes("--stats-only");
  let batchSize = 100;
  let maxRows = Number.POSITIVE_INFINITY;
  for (const a of argv) {
    const m = /^--batch-size=(\d+)$/.exec(a);
    if (m) batchSize = Math.min(500, Math.max(1, Number(m[1])));
    const m2 = /^--max=(\d+)$/.exec(a);
    if (m2) maxRows = Math.max(1, Number(m2[1]));
  }
  return { dryRun, statsOnly, batchSize, maxRows };
}

async function runStats(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("contractor_geocode_stats");
  if (error) {
    console.error(
      "Stats RPC failed (run migration 0003_contractors_geocode.sql):",
      error.message
    );
    const { count, error: cErr } = await supabase
      .from("contractors")
      .select("*", { count: "exact", head: true });
    if (!cErr) console.log("Total contractors (approx):", count ?? "—");
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const argv = process.argv.slice(2);
  const { dryRun, statsOnly, batchSize, maxRows } = parseArgs(argv);
  const supabase = getServiceClient();

  if (statsOnly) {
    await runStats(supabase);
    return;
  }

  const cache = new Map<string, GeocodeResult | "FAIL">();
  let cursor = "";
  let totalDone = 0;
  let success = 0;
  let failed = 0;
  let skipped = 0;
  let reused = 0;
  let cityFb = 0;
  let zipFb = 0;

  while (totalDone < maxRows) {
    const remaining = maxRows - totalDone;
    const limit = Math.min(batchSize, remaining);
    const { data, error } = await supabase.rpc("contractors_geocode_fetch_batch", {
      p_after: cursor,
      p_limit: limit,
    });

    if (error) {
      console.error(
        "Fetch batch failed — apply migration 0003_contractors_geocode.sql:",
        error.message
      );
      process.exit(1);
    }

    const rows = (data ?? []) as Row[];
    if (rows.length === 0) {
      console.log("\nNo more rows match the geocode selection criteria.");
      break;
    }

    for (const row of rows) {
      if (totalDone >= maxRows) break;

      totalDone++;
      const parts: AddressParts = {
        address: row.address,
        city: row.city,
        state: row.state,
        zip_code: row.zip_code,
      };
      const oneLine = normalizeAddressForGeocode(parts);
      console.log(
        `\n[${totalDone}] ${row.business_name} (${row.license_number})\n` +
          `  Address: ${oneLine ?? "(insufficient — skip)"}`
      );

      if (!oneLine) {
        skipped++;
        if (!dryRun) {
          const attempts = (row.geocode_attempts ?? 0) + 1;
          await supabase
            .from("contractors")
            .update({
              geocode_status: "failed",
              geocode_attempts: attempts,
              geocoded_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("license_number", row.license_number);
        }
        continue;
      }

      if (dryRun) {
        console.log("  (dry-run — no geocoder calls, no DB writes)");
        continue;
      }

      const key = addressDedupeKey(parts);
      let result: GeocodeResult | null = null;

      if (key && cache.has(key)) {
        const hit = cache.get(key)!;
        if (hit === "FAIL") {
          result = null;
        } else {
          result = hit;
          reused++;
          console.log(
            `  Reused cached coordinates for duplicate address (${key.slice(0, 56)}${key.length > 56 ? "…" : ""})`
          );
        }
      } else {
        result = await geocodeAddressParts(parts, {
          contactEmail: process.env.GEOCODE_CONTACT_EMAIL,
        });
        if (key) cache.set(key, result ?? "FAIL");
      }

      const attempts = (row.geocode_attempts ?? 0) + 1;

      if (result) {
        console.log(
          `  Source: ${result.source}\n` +
            `  Result: Success\n` +
            `  Precision: ${result.precision}` +
            (result.rawLabel ? `\n  Matched: ${result.rawLabel.slice(0, 120)}` : "")
        );
        if (result.precision === "city") cityFb++;
        if (result.precision === "zip") zipFb++;

        const { error: upErr } = await supabase
          .from("contractors")
          .update({
            latitude: result.latitude,
            longitude: result.longitude,
            geocode_precision: result.precision,
            geocode_source: result.source,
            geocoded_at: new Date().toISOString(),
            geocode_status: "success",
            geocode_attempts: attempts,
            updated_at: new Date().toISOString(),
          })
          .eq("license_number", row.license_number);

        if (upErr) {
          console.error("  DB update error:", upErr.message);
          failed++;
        } else {
          success++;
        }
      } else {
        console.log("  Result: Failed (no coordinates from providers)");
        await supabase
          .from("contractors")
          .update({
            geocode_status: "failed",
            geocode_attempts: attempts,
            geocoded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("license_number", row.license_number);
        failed++;
      }
    }

    cursor = rows[rows.length - 1]!.license_number;
    if (rows.length < limit) break;
  }

  console.log(
    `\n========== Summary ==========\n` +
      `Processed: ${totalDone}\n` +
      `Success: ${success}\n` +
      `Geocode failures: ${failed}\n` +
      `Skipped (no normalizable address): ${skipped}\n` +
      `Duplicate cache hits: ${reused}\n` +
      `City-level precision: ${cityFb}\n` +
      `Zip-level precision: ${zipFb}\n`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
