"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ContractorCard from "@/components/ContractorCard";
import { ContractorListSkeleton } from "@/components/Skeleton";
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

        const res = await fetch("/api/contractors/by-licenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ licenses }),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as Contractor[];

        if (!cancelled) {
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
    <div className="bg-surface-subtle min-h-[calc(100vh-3.5rem)] border-t border-line">
      <div className="page-container py-8 sm:py-12 max-w-4xl">
        <header className="mb-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-h1 text-ink">Saved</h1>
            <p className="text-sm text-ink-muted mt-1">
              {contractors.length > 0
                ? `${contractors.length} contractor${contractors.length === 1 ? "" : "s"} on your shortlist`
                : "Your shortlist lives in this browser. No account needed."}
            </p>
          </div>
          <Link href="/search" className="btn-secondary">
            Keep searching
          </Link>
        </header>

        {loading ? (
          <ContractorListSkeleton count={3} />
        ) : error ? (
          <div className="card border-danger-200 bg-danger-50 p-6 text-sm text-danger-700">
            {error}
          </div>
        ) : contractors.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3">
            {contractors.map((c) => (
              <ContractorCard key={c.license_number} contractor={c} dense />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto h-10 w-10 rounded-md bg-surface-subtle border border-line flex items-center justify-center">
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-ink-soft" fill="currentColor" aria-hidden>
          <path d="M5 3.75A1.75 1.75 0 0 1 6.75 2h6.5A1.75 1.75 0 0 1 15 3.75v14l-5-2.4-5 2.4v-14Z" />
        </svg>
      </div>
      <h2 className="mt-4 text-h3 text-ink">No saved contractors yet</h2>
      <p className="mt-1 text-sm text-ink-muted max-w-md mx-auto">
        Tap the bookmark on any contractor to save them here for quick comparison.
      </p>
      <Link href="/search" className="btn-primary mt-6 inline-flex">
        Start searching
      </Link>
    </div>
  );
}
