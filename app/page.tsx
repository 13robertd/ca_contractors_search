"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ContractorCard from "@/components/home/ContractorCard";
import CategoryStrip, {
  CATEGORIES,
  type CategoryId,
} from "@/components/home/CategoryStrip";
import HomeSearchBar from "@/components/home/HomeSearchBar";
import { MOCK_CONTRACTORS } from "@/lib/mockContractors";

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.id));

export default function HomePage() {
  const router = useRouter();
  const [active, setActive] = useState<CategoryId>("all");

  // Hydrate the active category from the URL once, client-side only
  // (avoids the Next 15 Suspense requirement of useSearchParams).
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

  const visible = useMemo(
    () =>
      active === "all"
        ? MOCK_CONTRACTORS
        : MOCK_CONTRACTORS.filter((c) => c.trade === active),
    [active]
  );

  return (
    <div className="bg-white">
      {/* 2. Category strip — sticky directly under the nav */}
      <section className="sticky top-16 z-30 bg-white border-b border-line-subtle">
        <div className="page-container">
          <CategoryStrip active={active} onChange={onCategoryChange} />
        </div>
      </section>

      {/* 3. Full search bar — hero */}
      <section>
        <div className="page-container pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-h1 sm:text-display text-ink-hero">
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

      {/* 4. Listings grid */}
      <section>
        <div className="page-container pb-20">
          {visible.length === 0 ? (
            <EmptyState activeLabel={labelFor(active)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visible.map((c) => (
                <ContractorCard key={c.licenseNumber} contractor={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function labelFor(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "this category";
}

function EmptyState({ activeLabel }: { activeLabel: string }) {
  return (
    <div className="py-24 text-center">
      <h2 className="text-h2 text-ink-hero">No {activeLabel} to show yet.</h2>
      <p className="mt-2 text-[14px] text-ink-secondary">
        Try another category above, or search directly.
      </p>
    </div>
  );
}
