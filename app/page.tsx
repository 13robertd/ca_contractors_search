import Link from "next/link";
import SearchBar from "@/components/SearchBar";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-surface-alt border-b border-hairline">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Verified public records · Updated daily
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tightish text-ink">
              Hire contractors you can
              <span className="text-brand-500"> actually trust</span>.
            </h1>
            <p className="mt-4 text-lg text-ink-muted max-w-2xl">
              Search licensed contractors in your area. Instantly verify license
              status, workers&apos; comp, bonding, and disciplinary history — all
              in one place.
            </p>
          </div>

          <div className="mt-8 max-w-3xl">
            <SearchBar variant="hero" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-subtle">
            <span>Try:</span>
            <Link className="text-ink-muted hover:text-brand-600" href="/search?location=Los+Angeles&trade=plumbing">
              Plumbers in Los Angeles
            </Link>
            <span>·</span>
            <Link className="text-ink-muted hover:text-brand-600" href="/search?location=San+Diego&trade=roofing">
              Roofers in San Diego
            </Link>
            <span>·</span>
            <Link className="text-ink-muted hover:text-brand-600" href="/search?trade=electrical">
              Electricians
            </Link>
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16 grid gap-5 sm:grid-cols-3">
        {[
          {
            title: "Verified license status",
            body: "See active/expired/suspended status and classifications pulled from public records.",
            icon: "✓",
          },
          {
            title: "Trust signals at a glance",
            body: "Workers' comp, contractor bond, pending suspensions, and disciplinary history — up front.",
            icon: "◎",
          },
          {
            title: "Save & compare",
            body: "Shortlist candidates, then compare experience, trades, and compliance side-by-side.",
            icon: "♥",
          },
        ].map((f) => (
          <div key={f.title} className="card p-5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600 text-base font-semibold">
              {f.icon}
            </div>
            <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
