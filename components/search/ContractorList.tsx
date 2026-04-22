"use client";

import { useEffect, useRef } from "react";
import ContractorCard from "@/components/ContractorCard";
import { cardDataFromContractor } from "@/lib/cardData";
import type { ContractorListing } from "@/lib/listings";
import type { TradeSlug } from "@/lib/trades";

interface Props {
  listings: ContractorListing[];
  highlightedId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  /** Active trade filter from the URL (?trade=plumbing). Promotes the
   *  matching trade to "primary" on each card so the accent bar and
   *  subtitle reflect what the user actually searched for. */
  searchTrade?: TradeSlug | null;
}

/**
 * The /search results list. Renders the shared ContractorCard in
 * detailed density. The accent-blue "highlighted" ring on each card is
 * driven by either map-marker hover or map-marker selection coming from
 * the SearchExperience parent.
 */
export default function ContractorList({
  listings,
  highlightedId,
  selectedId,
  onHover,
  searchTrade,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll the selected card into view when a marker is clicked on the map.
  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-license="${selectedId}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  if (listings.length === 0) {
    return (
      <div className="rounded-[12px] border border-line-subtle bg-white p-10 text-center">
        <h2 className="text-[18px] font-medium text-ink-hero tracking-[-0.2px]">
          No contractors in this map area
        </h2>
        <p className="mt-1.5 text-[14px] text-ink-secondary">
          Try zooming out or panning the map to find more results.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
    >
      {listings.map((l) => (
        <ContractorCard
          key={l.license_number}
          data={cardDataFromContractor(l, { searchTrade })}
          isHighlighted={
            highlightedId === l.license_number ||
            selectedId === l.license_number
          }
          onHover={onHover}
        />
      ))}
    </div>
  );
}
