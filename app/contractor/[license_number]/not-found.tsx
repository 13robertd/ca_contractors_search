import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-surface-subtle min-h-[calc(100vh-3.5rem)] border-t border-line">
      <div className="page-container py-20 max-w-xl text-center">
        <div className="mx-auto h-10 w-10 rounded-md bg-white border border-line flex items-center justify-center">
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-ink-soft" fill="currentColor" aria-hidden>
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 11H9v-2h2v2Zm0-3H9V6h2v4Z" />
          </svg>
        </div>
        <h1 className="mt-4 text-h2 text-ink">Contractor not found</h1>
        <p className="mt-1 text-sm text-ink-muted">
          We couldn&apos;t find a contractor with that license number.
        </p>
        <Link href="/search" className="btn-primary mt-6 inline-flex">
          Back to search
        </Link>
      </div>
    </div>
  );
}
