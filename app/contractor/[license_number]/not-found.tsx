import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-20 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-surface-alt flex items-center justify-center text-ink-muted">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-semibold text-ink">
        Contractor not found
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        We couldn&apos;t find a contractor with that license number.
      </p>
      <Link href="/search" className="btn-primary mt-6 inline-flex">
        Back to search
      </Link>
    </div>
  );
}
