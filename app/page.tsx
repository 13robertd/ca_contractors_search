"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ContractorCard from "@/components/home/ContractorCard";
import ContractorSection from "@/components/home/ContractorSection";
import CategoryStrip, {
  CATEGORIES,
  type CategoryId,
} from "@/components/home/CategoryStrip";
import HomeSearchBar from "@/components/home/HomeSearchBar";
import { MOCK_CONTRACTORS, type MockContractor } from "@/lib/mockContractors";

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.id));

/** Hardcoded for this pass — city switcher is out of scope. */
const CITY = "San Mateo";

/** "Newly licensed" window: last 24 months from today. */
const NEWLY_LICENSED_WINDOW_MS = 24 * 30 * 24 * 60 * 60 * 1000;

export default function HomePage() {
  const router = useRouter();
  const [active, setActive] = useState<CategoryId>("all");

  // Hydrate the active category from the URL once, client-side only.
  useEffect(() => {
    const trade = new URLSearchParams(window.location.search).get("trade");
    if (trade && VALID_CATEGORIES.has(trade as CategoryId)) {
      setActive(trade as CategoryId);
    }
  }, []);

  function onCategoryChange(id: CategoryId) {
    setActive(id);
    const params = new URLSearchParams(window.location.search);
    if (id === "all") params.delete("trade");
    else params.set("trade", id);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  // When a category is selected, we collapse the sectioned layout and just
  // render the filtered main grid. Sections only show when browsing "All".
  const showSections = active === "all";

  const plumbingSection = useMemo(
    () => sortByYearsDesc(byPrimary(MOCK_CONTRACTORS, "plumbing")).slice(0, 8),
    []
  );
  const electricalSection = useMemo(
    () => sortByYearsDesc(byPrimary(MOCK_CONTRACTORS, "electrical")).slice(0, 8),
    []
  );
  const insuredSection = useMemo(
    () =>
      sortByYearsDesc(
        MOCK_CONTRACTORS.filter(
          (c) => c.status === "active" && c.bonded && c.workersComp
        )
      ).slice(0, 8),
    []
  );
  const newlyLicensedSection = useMemo(() => {
    const cutoff = Date.now() - NEWLY_LICENSED_WINDOW_MS;
    return MOCK_CONTRACTORS.filter(
      (c) => c.status === "active" && Date.parse(c.issueDate) >= cutoff
    )
      .sort((a, b) => Date.parse(b.issueDate) - Date.parse(a.issueDate))
      .slice(0, 8);
  }, []);

  const mainGrid = useMemo(() => {
    if (active === "all") return MOCK_CONTRACTORS;
    return MOCK_CONTRACTORS.filter((c) => c.primaryTrade === active);
  }, [active]);

  return (
    <div className="bg-white">
      {/* Category strip — sticky directly under the nav */}
      <section className="sticky top-16 z-30 bg-white border-b border-line-subtle">
        <div className="page-container">
          <CategoryStrip active={active} onChange={onCategoryChange} />
        </div>
      </section>

      {/* Hero search */}
      <section>
        <div className="page-container pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[36px] sm:text-[44px] font-medium leading-[1.1] text-ink-hero tracking-[-0.02em]">
              Find a licensed contractor you can trust.
            </h1>
            <p className="mt-3 text-[15px] text-ink-secondary">
              Every listing is verified against California CSLB public records.
            </p>
          </div>

          <div className="mt-8 max-w-3xl mx-auto">
            <HomeSearchBar size="lg" />
          </div>
        </div>
      </section>

      {/* Curated sections (only when browsing "All") */}
      {showSections ? (
        <section>
          <div className="page-container">
            <ContractorSection
              title={`Established plumbers in ${CITY}`}
              contractors={plumbingSection}
              seeAllHref="/search?trade=plumbing&sort=yearsDesc"
            />
            <ContractorSection
              title={`Fully insured contractors in ${CITY}`}
              subtitle="Workers' comp and bond on file"
              contractors={insuredSection}
              seeAllHref="/search?insured=1&sort=yearsDesc"
            />
            <ContractorSection
              title={`Top electricians in ${CITY}`}
              contractors={electricalSection}
              seeAllHref="/search?trade=electrical&sort=yearsDesc"
            />
            <ContractorSection
              title={`Newly licensed in ${CITY}`}
              subtitle="Recent additions to the CSLB registry"
              contractors={newlyLicensedSection}
              seeAllHref="/search?sort=newestFirst"
            />
          </div>
        </section>
      ) : null}

      {/* Main grid */}
      <section>
        <div className="page-container pb-20">
          <h2 className="text-[22px] font-medium text-ink-hero tracking-[-0.3px]">
            {active === "all"
              ? `All contractors in ${CITY}`
              : `${labelFor(active)} in ${CITY}`}
          </h2>
          <p className="mt-1 text-[15px] text-ink-secondary">
            {mainGrid.length} {mainGrid.length === 1 ? "listing" : "listings"}
          </p>

          {mainGrid.length === 0 ? (
            <EmptyState activeLabel={labelFor(active)} />
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mainGrid.map((c, i) => (
                <ContractorCard
                  key={c.licenseNumber}
                  contractor={c}
                  variant={i % 2 === 0 ? "license" : "trade"}
                  size="default"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function byPrimary(list: MockContractor[], trade: string): MockContractor[] {
  return list.filter((c) => c.primaryTrade === trade);
}

function sortByYearsDesc(list: MockContractor[]): MockContractor[] {
  return [...list].sort((a, b) => b.yearsInBusiness - a.yearsInBusiness);
}

function labelFor(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "contractors";
}

function EmptyState({ activeLabel }: { activeLabel: string }) {
  return (
    <div className="py-24 text-center">
      <h2 className="text-[22px] font-medium text-ink-hero">
        No {activeLabel} to show yet.
      </h2>
      <p className="mt-2 text-[14px] text-ink-secondary">
        Try another category above, or search directly.
      </p>
    </div>
  );
}
