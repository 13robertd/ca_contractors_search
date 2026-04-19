import Link from "next/link";
import SearchBar from "@/components/SearchBar";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b border-line">
        <div className="page-container pt-16 sm:pt-24 pb-14 sm:pb-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 h-6 px-2 rounded-sm border border-line bg-surface-subtle text-[11px] font-medium text-ink-muted">
              <span className="status-dot bg-positive-500" />
              Verified public records · Updated daily
            </span>

            <h1 className="mt-5 text-display text-ink">Fixd</h1>
            <p className="mt-2 text-h2 text-ink">
              Find trusted contractors near you.
            </p>
            <p className="mt-3 max-w-xl text-base text-ink-muted">
              Search by location and trade. Instantly see who&apos;s licensed,
              bonded, and ready to hire.
            </p>
          </div>

          <div className="mt-8 max-w-3xl">
            <SearchBar size="lg" />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <span className="text-ink-muted font-medium">Popular:</span>
            <Link className="hover:text-ink transition-colors" href="/search?location=Los+Angeles&trade=plumbing">
              Plumbers in Los Angeles
            </Link>
            <Link className="hover:text-ink transition-colors" href="/search?location=San+Diego&trade=roofing">
              Roofers in San Diego
            </Link>
            <Link className="hover:text-ink transition-colors" href="/search?trade=electrical">
              Electricians
            </Link>
          </div>
        </div>
      </section>

      {/* Value pillars */}
      <section className="bg-surface-subtle border-b border-line">
        <div className="page-container py-14 sm:py-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.title} className="card p-5">
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-ink text-white text-sm">
                  {p.glyph}
                </div>
                <h3 className="mt-4 text-h3 text-ink">{p.title}</h3>
                <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section>
        <div className="page-container py-14 sm:py-16">
          <div className="grid gap-8 md:grid-cols-2 items-start">
            <div>
              <h2 className="text-h2 text-ink">Trust, not guesswork.</h2>
              <p className="mt-3 text-ink-muted leading-relaxed">
                Every contractor on Fixd is surfaced straight from public
                license records — including active status, bond coverage,
                workers&apos; comp, and any disciplinary history. No filler. No
                fake reviews. Just the signals that actually matter when
                you&apos;re about to sign a contract.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link href="/search" className="btn-primary btn-lg">
                  Start searching
                </Link>
                <Link href="/saved" className="btn-ghost btn-lg">
                  View your saved list
                </Link>
              </div>
            </div>

            <ul className="grid grid-cols-2 gap-3 text-sm">
              {CHECKS.map((c) => (
                <li key={c} className="flex items-start gap-2 text-ink-muted">
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="mt-0.5 h-4 w-4 shrink-0 text-positive-700"
                  >
                    <path
                      fill="currentColor"
                      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L9 11.6l6.3-6.3a1 1 0 0 1 1.4 0Z"
                    />
                  </svg>
                  <span className="text-ink">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

const PILLARS = [
  {
    glyph: "✓",
    title: "Verified license status",
    body: "Active, expired, and suspended licenses — straight from public records, refreshed daily.",
  },
  {
    glyph: "◎",
    title: "Trust signals up front",
    body: "Workers' comp, contractor bond, pending suspensions, and disciplinary history, at a glance.",
  },
  {
    glyph: "★",
    title: "Save & compare",
    body: "Shortlist candidates and compare experience, trades, and compliance side-by-side.",
  },
];

const CHECKS = [
  "Active license check",
  "Workers' comp verified",
  "Contractor bond on file",
  "Disciplinary history flagged",
  "Classification codes shown",
  "Years in business",
];
