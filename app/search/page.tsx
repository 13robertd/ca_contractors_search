import SearchBar from "@/components/SearchBar";
import ContractorCard from "@/components/ContractorCard";
import FilterPanel from "@/components/FilterPanel";
import {
  searchContractors,
  getDistinctCounties,
  getDistinctPrimaryTrades,
} from "@/lib/queries";

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

  const [results, counties, primaryTrades] = await Promise.all([
    searchContractors({
      location,
      trade,
      county,
      primaryTrade,
      activeOnly,
    }).catch((err) => {
      console.error(err);
      return [];
    }),
    getDistinctCounties().catch(() => []),
    getDistinctPrimaryTrades().catch(() => []),
  ]);

  const summary = buildSummary({
    location,
    trade,
    county,
    primaryTrade,
    activeOnly,
    count: results.length,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <SearchBar initialLocation={location ?? ""} initialTrade={trade ?? ""} />

      <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
        <FilterPanel counties={counties} primaryTrades={primaryTrades} />

        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {results.length} result{results.length === 1 ? "" : "s"}
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">{summary}</p>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((c) => (
                <ContractorCard key={c.license_number} contractor={c} />
              ))}
            </div>
          )}
        </section>
      </div>
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

function EmptyState() {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
        🔍
      </div>
      <h2 className="mt-4 font-semibold text-slate-900">No contractors found</h2>
      <p className="mt-1 text-sm text-slate-600">
        Try a broader location, a different trade keyword, or turn off the
        &quot;Active licenses only&quot; filter.
      </p>
    </div>
  );
}
