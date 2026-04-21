import { Suspense } from "react";
import { searchContractors } from "@/lib/queries";
import { toListings, type ContractorListing } from "@/lib/listings";
import SearchExperience from "@/components/search/SearchExperience";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const location = asString(sp.location);
  const trade = asString(sp.trade);
  const keyword = asString(sp.q);
  const when = asString(sp.when);
  const county = asString(sp.county);
  const primaryTrade = asString(sp.primaryTrade);
  const activeOnly = asString(sp.active) !== "0";
  const minYears = parsePositiveInt(asString(sp.minYears));

  return (
    <Suspense fallback={null}>
      <SearchLoader
        location={location}
        trade={trade ?? keyword}
        keyword={keyword}
        when={when}
        county={county}
        primaryTrade={primaryTrade}
        activeOnly={activeOnly}
        minYears={minYears}
      />
    </Suspense>
  );
}

/** Parse a "?minYears=20" style param; returns undefined unless it's a positive integer. */
function parsePositiveInt(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

interface LoaderProps {
  location?: string;
  trade?: string;
  keyword?: string;
  when?: string;
  county?: string;
  primaryTrade?: string;
  activeOnly: boolean;
  minYears?: number;
}

async function SearchLoader(props: LoaderProps) {
  let listings: ContractorListing[] = [];
  try {
    const rows = await searchContractors({
      location: props.location,
      trade: props.trade,
      county: props.county,
      primaryTrade: props.primaryTrade,
      activeOnly: props.activeOnly,
      minYears: props.minYears,
    });
    listings = toListings(rows);
  } catch (err) {
    console.error("[search] searchContractors failed:", err);
  }

  return (
    <SearchExperience
      listings={listings}
      initial={{
        location: props.location,
        trade: props.trade,
        keyword: props.keyword,
        when: props.when,
      }}
    />
  );
}
