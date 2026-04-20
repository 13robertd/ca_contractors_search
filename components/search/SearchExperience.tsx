"use client";

import { useCallback, useMemo, useState } from "react";
import MarketplaceSearchBar from "./MarketplaceSearchBar";
import ResultsHeader from "./ResultsHeader";
import ContractorList from "./ContractorList";
import ContractorMap from "./ContractorMap";
import MapSummaryCard from "./MapSummaryCard";
import type { ContractorListing } from "@/lib/listings";
import { isInBounds, type Bounds } from "@/lib/geo";

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
 * The page-level Server Component only fetches data; all interactivity lives
 * here so we never serialize handlers across the RSC boundary.
 */
export default function SearchExperience({ listings, initial }: Props) {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [searchOnMove, setSearchOnMove] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  // --- bounds-driven filtering -------------------------------------------------
  // A listing is "in this map area" when:
  //   1. It has resolved coordinates (DB doesn't yet store these, so missing is
  //      possible — those listings never appear on the map but stay in the
  //      "all" total to be honest about hidden inventory).
  //   2. Its coordinates fall inside the current map bounds.
  // When bounds aren't known yet (first paint, no Mapbox token) we show all
  // geo-resolved listings so the page is useful even without a map.
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
    <div className="bg-surface-subtle min-h-[calc(100vh-3.5rem)] border-t border-line">
      {/* Sticky search/filter bar */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-line">
        <div className="page-container py-3">
          <MarketplaceSearchBar
            initialLocation={initial.location}
            initialTrade={initial.trade}
            initialKeyword={initial.keyword}
            initialWhen={initial.when}
          />
        </div>

        {/* Mobile list/map toggle */}
        <div className="lg:hidden border-t border-line">
          <div className="page-container py-2 flex items-center gap-2">
            <ToggleButton
              active={mobileView === "list"}
              onClick={() => setMobileView("list")}
            >
              List
            </ToggleButton>
            <ToggleButton
              active={mobileView === "map"}
              onClick={() => setMobileView("map")}
            >
              Map
            </ToggleButton>
            <span className="ml-auto text-xs text-ink-muted tabular-nums">
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
          } lg:block px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto lg:max-h-[calc(100vh-3.5rem-72px)]`}
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
          />

          {noGeoData ? (
            <p className="mt-6 text-xs text-ink-soft">
              Note: contractor coordinates are derived from city; precise
              addresses will land once geocoding is wired to the database.
            </p>
          ) : null}
        </section>

        {/* Map panel */}
        <aside
          className={`${
            mobileView === "map" ? "block" : "hidden"
          } lg:block lg:sticky lg:top-[calc(3.5rem+72px)] self-start`}
          aria-label="Contractor map"
        >
          <div className="relative h-[calc(100vh-3.5rem-72px)] lg:rounded-none p-0 lg:p-3">
            <div className="relative h-full">
              <ContractorMap
                listings={listings}
                highlightedId={highlightedId}
                selectedId={selectedId}
                onBoundsChange={handleBoundsChange}
                onMarkerHover={handleHover}
                onMarkerSelect={handleMarkerSelect}
                emitBoundsOnMove={searchOnMove}
              />
              {visibleListings.length === 0 && bounds ? (
                <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex justify-center">
                  <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur border border-line shadow-card text-xs text-ink-muted">
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

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center h-8 px-4 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-ink text-white"
          : "bg-white border border-line text-ink hover:bg-surface-subtle"
      }`}
    >
      {children}
    </button>
  );
}
