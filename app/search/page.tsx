import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import ContractorCard from "@/components/ContractorCard";
import FilterPanel from "@/components/FilterPanel";
import { ContractorListSkeleton } from "@/components/Skeleton";
import {
  searchContractors,
  getDistinctCounties,
  getDistinctPrimaryTrades,
} from "@/lib/queries";
import type { Contractor } from "@/types/contractor";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const location = asString(sp.location);
  const trade = asString(sp.trade);
  const county = asString(sp.county);
  const primaryTrade = asString(sp.primaryTrade);
  const activeOnly = asString(sp.active) !== "0";

  return (
    <div className="bg-surface-subtle min-h-[calc(100vh-3.5rem)] border-t border-line">
      {/* Search header bar */}
      <div className="bg-white border-b border-line">
        <div className="page-container py-4">
          <SearchBar
            initialLocation={location ?? ""}
            initialTrade={trade ?? ""}
          />
        </div>
      </div>

      <div className="page-container py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
          {/* Filters */}
          <div className="lg:sticky lg:top-[calc(3.5rem+1rem)] self-start">
            <Suspense
              fallback={
                <div className="card p-5 space-y-4">
                  <div className="skeleton h-5 w-20" />
                  <div className="skeleton h-9 w-full" />
                  <div className="skeleton h-9 w-full" />
                </div>
              }
            >
              <FilterPanelLoader />
            </Suspense>
          </div>

          {/* Results */}
          <section aria-label="Search results" className="min-w-0">
            <Suspense
              key={JSON.stringify({ location, trade, county, primaryTrade, activeOnly })}
              fallback={<ResultsSkeleton />}
            >
              <Results
                location={location}
                trade={trade}
                county={county}
                primaryTrade={primaryTrade}
                activeOnly={activeOnly}
              />
            </Suspense>
          </section>

          {/* Map placeholder (desktop only) */}
          <aside className="hidden lg:block lg:sticky lg:top-[calc(3.5rem+1rem)] self-start">
            <MapPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}

async function FilterPanelLoader() {
  const [counties, primaryTrades] = await Promise.all([
    getDistinctCounties().catch(() => [] as string[]),
    getDistinctPrimaryTrades().catch(() => [] as string[]),
  ]);
  return <FilterPanel counties={counties} primaryTrades={primaryTrades} />;
}

interface ResultsProps {
  location?: string;
  trade?: string;
  county?: string;
  primaryTrade?: string;
  activeOnly: boolean;
}

async function Results(props: ResultsProps) {
  let results: Contractor[] = [];
  let error: string | null = null;

  try {
    results = await searchContractors(props);
  } catch (err) {
    console.error("[search] searchContractors failed:", err);
    error = err instanceof Error ? err.message : "Unknown Supabase error";
  }

  const summary = buildSummary({ ...props, count: results.length });

  return (
    <div>
      <header className="flex items-end justify-between mb-4">
        <div className="min-w-0">
          <h1 className="text-h2 text-ink">
            {results.length} {results.length === 1 ? "result" : "results"}
          </h1>
          <p className="text-sm text-ink-muted mt-0.5 truncate">{summary}</p>
        </div>
      </header>

      {error ? (
        <ErrorState message={error} />
      ) : results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3">
          {results.map((c) => (
            <ContractorCard key={c.license_number} contractor={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div>
      <div className="mb-4 space-y-2">
        <div className="skeleton h-7 w-24" />
        <div className="skeleton h-4 w-64" />
      </div>
      <ContractorListSkeleton count={6} />
    </div>
  );
}

function buildSummary(args: {
  location?: string;
  trade?: string;
  county?: string;
  primaryTrade?: string;
  activeOnly: boolean;
  count: number;
}): string {
  const parts: string[] = [];
  if (args.trade) parts.push(`"${args.trade}"`);
  if (args.primaryTrade) parts.push(`trade: ${args.primaryTrade}`);
  if (args.location) parts.push(`near ${args.location}`);
  if (args.county) parts.push(`in ${args.county} County`);
  if (args.activeOnly) parts.push("active only");
  return parts.length
    ? `Filtered by ${parts.join(" · ")}`
    : "Showing top contractors";
}

function MapPanel() {
  return (
    <div className="map-placeholder card flex flex-col items-center justify-center text-center h-[calc(100vh-8rem)] min-h-[420px]">
      <div className="max-w-[16rem] bg-white/90 backdrop-blur rounded-md border border-line p-4 shadow-card">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white mb-3">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M10 18s6-5.5 6-10a6 6 0 1 0-12 0c0 4.5 6 10 6 10Zm0-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="text-sm font-semibold text-ink">Map view — coming soon</div>
        <p className="mt-1 text-xs text-ink-muted leading-relaxed">
          See contractors on a live map, filtered by your search. List view
          stays the fastest way to compare right now.
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto h-10 w-10 rounded-md bg-surface-subtle border border-line flex items-center justify-center">
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-ink-soft" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M9 2a7 7 0 1 0 4.192 12.606l3.101 3.1a1 1 0 0 0 1.414-1.414l-3.1-3.1A7 7 0 0 0 9 2Zm-5 7a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-h3 text-ink">No contractors found</h2>
      <p className="mt-1 text-sm text-ink-muted max-w-md mx-auto">
        Try a broader location, a different trade keyword, or turn off the
        &quot;Active licenses only&quot; filter.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const showDetails = process.env.NODE_ENV !== "production";
  return (
    <div className="card border-danger-200 bg-danger-50 p-6">
      <h2 className="text-h3 text-danger-700">
        Couldn&apos;t reach the contractors database
      </h2>
      <p className="mt-1 text-sm text-danger-700/90">
        This is usually a misconfigured Supabase env var on the server. Check
        your Vercel project settings for{" "}
        <code className="font-mono text-xs bg-white px-1 py-0.5 rounded-sm">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="font-mono text-xs bg-white px-1 py-0.5 rounded-sm">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>
        , then redeploy.
      </p>
      {showDetails ? (
        <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-danger-700/80">
          {message}
        </pre>
      ) : null}
    </div>
  );
}
