"use client";

export interface MapGeoSummary {
  precise: number;
  approximate: number;
  mailingHidden: number;
}

interface Props {
  /** Contractors included in the current list slice (e.g. in map bounds). */
  inBoundsCount: number;
  mapGeoSummary: MapGeoSummary;
  searchOnMove: boolean;
  onToggleSearchOnMove: () => void;
}

/**
 * Floating summary over the map: in-bounds count, geocode trust breakdown,
 * and “search as I move”.
 */
export default function MapSummaryCard({
  inBoundsCount,
  mapGeoSummary,
  searchOnMove,
  onToggleSearchOnMove,
}: Props) {
  const { precise, approximate, mailingHidden } = mapGeoSummary;

  return (
    <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none z-10 px-2">
      <div className="pointer-events-auto max-w-[min(100%,28rem)] rounded-xl bg-white border border-line-subtle shadow-card px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-ink-hero text-white text-[11px] font-medium tabular-nums shrink-0">
            {inBoundsCount}
          </span>
          <span className="text-[13px] text-ink-hero font-medium">
            in this area
          </span>
          <span aria-hidden className="hidden sm:inline w-px h-4 bg-line-subtle shrink-0" />
          <label className="inline-flex items-center gap-2 text-[12px] text-ink-secondary select-none cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={searchOnMove}
              onChange={onToggleSearchOnMove}
              className="h-3.5 w-3.5 accent-brand"
            />
            Search as I move
          </label>
        </div>
        <div className="mt-2 pt-2 border-t border-line-subtle text-[11px] text-ink-secondary leading-snug tabular-nums space-y-0.5">
          <div>
            <span className="font-medium text-ink">{precise}</span> mapped precisely
          </div>
          <div>
            <span className="font-medium text-ink">{approximate}</span> approximate
          </div>
          <div>
            <span className="font-medium text-ink">{mailingHidden}</span> mailing-only hidden from map
          </div>
        </div>
      </div>
    </div>
  );
}
