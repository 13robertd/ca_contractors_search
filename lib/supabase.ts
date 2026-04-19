import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase client for the anon (public-read) role.
 *
 * Env vars required (see .env.local.example):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * This client is safe to use on both the server and the client because the
 * `contractors` table is public-read via RLS.
 */

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
