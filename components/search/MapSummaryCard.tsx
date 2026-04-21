"use client";

interface Props {
  count: number;
  searchOnMove: boolean;
  onToggleSearchOnMove: () => void;
}

/**
 * Floating summary pill over the map. Uses the home page's neutral
 * border + subtle line tokens (line-subtle, ink-hero, ink-secondary)
 * and the brand crimson for the count badge's accent.
 */
export default function MapSummaryCard({
  count,
  searchOnMove,
  onToggleSearchOnMove,
}: Props) {
  return (
    <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none z-10">
      <div className="pointer-events-auto inline-flex items-center gap-3 px-3 py-2 rounded-full bg-white border border-line-subtle shadow-card">
        <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-ink-hero text-white text-[11px] font-medium tabular-nums">
          {count}
        </span>
        <span className="text-[13px] text-ink-hero font-medium">
          contractors in this area
        </span>
        <span aria-hidden className="w-px h-4 bg-line-subtle" />
        <label className="inline-flex items-center gap-2 text-[12px] text-ink-secondary select-none cursor-pointer">
          <input
            type="checkbox"
            checked={searchOnMove}
            onChange={onToggleSearchOnMove}
            className="h-3.5 w-3.5 accent-brand"
          />
          Search as I move the map
        </label>
      </div>
    </div>
  );
}
