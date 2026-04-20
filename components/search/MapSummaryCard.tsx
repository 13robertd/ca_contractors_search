"use client";

interface Props {
  count: number;
  searchOnMove: boolean;
  onToggleSearchOnMove: () => void;
}

export default function MapSummaryCard({
  count,
  searchOnMove,
  onToggleSearchOnMove,
}: Props) {
  return (
    <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none z-10">
      <div className="pointer-events-auto inline-flex items-center gap-3 px-3 py-2 rounded-full bg-white/95 backdrop-blur border border-line shadow-card">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-ink text-white text-[11px] font-semibold tabular-nums">
          {count}
        </span>
        <span className="text-sm text-ink font-medium">
          contractors in this area
        </span>
        <span aria-hidden className="w-px h-4 bg-line" />
        <label className="inline-flex items-center gap-2 text-xs text-ink-muted select-none cursor-pointer">
          <input
            type="checkbox"
            checked={searchOnMove}
            onChange={onToggleSearchOnMove}
            className="h-3.5 w-3.5 accent-ink"
          />
          Search as I move the map
        </label>
      </div>
    </div>
  );
}
