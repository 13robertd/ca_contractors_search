#!/usr/bin/env node
/**
 * Pre-deploy env-var sanity check.
 * Reads .env.local (if present) and verifies the required Supabase vars
 * are set and look reasonable before we hand off to `vercel` / `next build`.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

// If a .env.local file exists, load it into process.env (just for this check).
const envPath = resolve(ROOT, ".env.local");
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

const missing = [];
const warnings = [];

for (const key of REQUIRED) {
  const val = process.env[key];
  if (!val) {
    missing.push(key);
    continue;
  }
  if (key === "NEXT_PUBLIC_SUPABASE_URL") {
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(val)) {
      warnings.push(`${key} doesn't look like a Supabase URL: ${val}`);
    }
  }
  if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    if (val.startsWith("sb_secret_")) {
      console.error(
        `\n✕ ${key} looks like a SERVICE / SECRET key. Never ship that to the browser.`
      );
      console.error("  Use the anon / publishable key instead.\n");
      process.exit(1);
    }
    const looksLikeJwt = val.startsWith("eyJ");
    const looksLikePublishable = val.startsWith("sb_publishable_");
    if (!looksLikeJwt && !looksLikePublishable) {
      warnings.push(
        `${key} doesn't look like a Supabase anon/publishable key (should start with "eyJ" or "sb_publishable_").`
      );
    }
  }
}

if (missing.length) {
  console.error("\n✕ Missing required environment variables:");
  for (const k of missing) console.error(`   - ${k}`);
  console.error("\nAdd them to .env.local (local dev) or via `vercel env add` (production).\n");
  process.exit(1);
}

for (const w of warnings) console.warn(`⚠ ${w}`);
console.log("✓ Required env vars present:", REQUIRED.join(", "));
