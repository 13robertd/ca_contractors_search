"use client";

import { useCallback, useMemo, useState } from "react";
import MarketplaceSearchBar from "./MarketplaceSearchBar";
import SearchCategoryStrip from "./SearchCategoryStrip";
import ResultsHeader from "./ResultsHeader";
import ContractorList from "./ContractorList";
import ContractorMap from "./ContractorMap";
import MapSummaryCard from "./MapSummaryCard";
import { PillButton } from "@/components/ui";
import type { ContractorListing } from "@/lib/listings";
import { isInBounds, type Bounds } from "@/lib/geo";
import { TRADE_TAXONOMY, type TradeSlug } from "@/lib/trades";

/** A trade URL param is "valid" iff it maps to a known TradeSlug —
 *  guards against arbitrary strings being treated as trade slugs. */
function asTradeSlug(value: string | undefined | null): TradeSlug | null {
  if (!value) return null;
  return value in TRADE_TAXONOMY ? (value as TradeSlug) : null;
}

interface Props {
  listings: ContractorListing[];
  initial: {
    location?: string;
    trade?: string;
    keyword?: string;
    when?: string;
  };
}

type MobileView = "list" | "map";

/**
 * Owns the cross-cutting state for the search experience:
 *   - current visible map bounds (drives result filtering + count)
 *   - hovered/selected listing (drives card<->marker highlighting)
 *   - "search as I move" toggle (defaults on; off freezes bounds)
 *   - mobile list/map toggle
 *
 * Surface tokens are aligned with the home page: white page background,
 * line-subtle borders, ink-hero/ink-secondary typography.
 */
export default function SearchExperience({ listings, initial }: Props) {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [searchOnMove, setSearchOnMove] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  const visibleListings = useMemo(() => {
    return listings.filter((l) => {
      if (l.latitude == null || l.longitude == null) return false;
      if (!bounds) return true;
      return isInBounds(
        { latitude: l.latitude, longitude: l.longitude },
        bounds
      );
    });
  }, [listings, bounds]);

  const handleBoundsChange = useCallback((b: Bounds) => {
    setBounds(b);
  }, []);

  const handleMarkerSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleHover = useCallback((id: string | null) => {
    setHighlightedId(id);
  }, []);

  const isFiltered = bounds !== null && visibleListings.length < listings.length;
  const noGeoData = listings.every((l) => l.latitude == null);

  return (
    <div className="bg-surface-subtle min-h-[calc(100vh-4rem)]">
      {/* Sticky search/filter bar */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-line-subtle">
        <div className="page-container py-4">
          <MarketplaceSearchBar
            initialLocation={initial.location}
            initialTrade={initial.trade}
            initialKeyword={initial.keyword}
            initialWhen={initial.when}
          />
        </div>

        <SearchCategoryStrip />

        {/* Mobile list/map toggle */}
        <div className="lg:hidden border-t border-line-subtle">
          <div className="page-container py-2 flex items-center gap-2">
            <PillButton
              size="sm"
              variant={mobileView === "list" ? "active" : "neutral"}
              aria-pressed={mobileView === "list"}
              onClick={() => setMobileView("list")}
            >
              List
            </PillButton>
            <PillButton
              size="sm"
              variant={mobileView === "map" ? "active" : "neutral"}
              aria-pressed={mobileView === "map"}
              onClick={() => setMobileView("map")}
            >
              Map
            </PillButton>
            <span className="ml-auto text-[13px] text-ink-secondary tabular-nums">
              {visibleListings.length} in view
            </span>
          </div>
        </div>
      </div>

      {/* Split layout: list (left) / map (right). 60/40 on desktop. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-0">
        {/* List panel */}
        <section
          aria-label="Contractor results"
          className={`${
            mobileView === "list" ? "block" : "hidden"
          } lg:block px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto lg:max-h-[calc(100vh-4rem-108px)]`}
        >
          <ResultsHeader
            visibleCount={visibleListings.length}
            totalCount={listings.length}
            isFiltered={isFiltered}
          />
          <ContractorList
            listings={visibleListings}
            highlightedId={highlightedId}
            selectedId={selectedId}
            onHover={handleHover}
            searchTrade={asTradeSlug(initial.trade)}
          />

          {noGeoData ? (
            <p className="mt-6 text-[13px] text-ink-tertiary">
              Note: contractor coordinates are derived from city; precise
              addresses will land once geocoding is wired to the database.
            </p>
          ) : null}
        </section>

        {/* Map panel */}
        <aside
          className={`${
            mobileView === "map" ? "block" : "hidden"
          } lg:block lg:sticky lg:top-[calc(4rem+108px)] self-start`}
          aria-label="Contractor map"
        >
          <div className="relative h-[calc(100vh-4rem-108px)] p-0 lg:p-4">
            {/* Map gets card language: 12px radius + subtle border */}
            <div className="relative h-full overflow-hidden rounded-none lg:rounded-[12px] lg:border lg:border-line-subtle bg-surface-subtle">
              <ContractorMap
                listings={listings}
                highlightedId={highlightedId}
                selectedId={selectedId}
                onBoundsChange={handleBoundsChange}
                onMarkerHover={handleHover}
                onMarkerSelect={handleMarkerSelect}
                searchTrade={asTradeSlug(initial.trade)}
                onClearSelection={() => setSelectedId(null)}
                emitBoundsOnMove={searchOnMove}
              />
              {visibleListings.length === 0 && bounds ? (
                <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex justify-center">
                  <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-line-subtle shadow-card text-[13px] text-ink-secondary">
                    Map results will appear as location data becomes available.
                  </div>
                </div>
              ) : null}
              <MapSummaryCard
                count={visibleListings.length}
                searchOnMove={searchOnMove}
                onToggleSearchOnMove={() => setSearchOnMove((v) => !v)}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

