"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ContractorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Fixd] contractor detail error", {
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <div className="bg-surface-subtle min-h-[calc(100vh-3.5rem)] border-t border-line">
      <div className="page-container py-16 max-w-xl">
        <div className="card p-8 text-center">
          <h1 className="text-h2 text-ink">Couldn&apos;t load this contractor</h1>
          <p className="mt-2 text-sm text-ink-muted">
            The record may be temporarily unavailable. Try again, or return to
            search.
          </p>
          {error?.digest ? (
            <p className="mt-4 text-[11px] text-ink-soft font-mono tabular-nums">
              Ref: {error.digest}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button onClick={reset} className="btn-primary">
              Try again
            </button>
            <Link href="/search" className="btn-secondary">
              Back to search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
