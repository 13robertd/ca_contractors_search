import Link from "next/link";
import SearchBar from "@/components/SearchBar";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-10 sm:pb-14 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-medium text-brand-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Verified public records · Updated daily
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
            Hire contractors you can
            <span className="text-brand-600"> actually trust</span>.
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Search licensed contractors in your area. Instantly verify license
            status, workers&apos; comp, bonding, and disciplinary history — all
            in one place.
          </p>

          <div className="mt-8 max-w-3xl mx-auto text-left">
            <SearchBar />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            <span>Try:</span>
            <Link className="hover:text-brand-700" href="/search?location=Los+Angeles&trade=plumbing">
              Plumbers in Los Angeles
            </Link>
            <span>·</span>
            <Link className="hover:text-brand-700" href="/search?location=San+Diego&trade=roofing">
              Roofers in San Diego
            </Link>
            <span>·</span>
            <Link className="hover:text-brand-700" href="/search?trade=electrical">
              Electricians
            </Link>
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12 grid gap-5 sm:grid-cols-3">
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
            icon: "★",
          },
        ].map((f) => (
          <div key={f.title} className="card p-5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-base font-semibold">
              {f.icon}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
