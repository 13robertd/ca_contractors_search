"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ContractorCard from "@/components/ContractorCard";
import { getSavedLicenses } from "@/lib/savedContractors";
import type { Contractor } from "@/types/contractor";

export default function SavedPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const licenses = getSavedLicenses();
        if (licenses.length === 0) {
          if (!cancelled) setContractors([]);
          return;
        }

        // Keep the Supabase SDK off the client bundle — go through the
        // Route Handler instead.
        const res = await fetch("/api/contractors/by-licenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ licenses }),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as Contractor[];

        if (!cancelled) {
          // Preserve the order the user saved them in.
          const byId = new Map(data.map((c) => [c.license_number, c]));
          const ordered = licenses
            .map((l) => byId.get(l))
            .filter((c): c is Contractor => Boolean(c));
          setContractors(ordered);
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Failed to load saved contractors";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const refresh = () => load();
    window.addEventListener("saved-contractors-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("saved-contractors-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tightish text-ink">Saved contractors</h1>
        <p className="text-sm text-ink-muted mt-1">
          Your shortlist lives in this browser. No account needed.
        </p>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Loading your saved contractors…
        </div>
      ) : error ? (
        <div className="card p-6 border-brand-200 bg-brand-50 text-sm text-brand-800">
          {error}
        </div>
      ) : contractors.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-surface-alt flex items-center justify-center text-brand-500">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="mt-4 font-semibold text-ink">No saved contractors yet</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Tap the heart on any contractor to save them here for quick comparison.
          </p>
          <Link href="/search" className="btn-primary mt-6 inline-flex">
            Start searching
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contractors.map((c) => (
            <ContractorCard key={c.license_number} contractor={c} />
          ))}
        </div>
      )}
    </div>
  );
}
