"use client";

import { useState } from "react";
import { getTradeStyle } from "@/lib/trade-colors";

interface Props {
  labels?: string[] | null;
  /** When set alongside `expandable`, acts as the collapsed preview length. */
  max?: number;
  /** If true, a truncated list shows a clickable "+N more" / "Show less" toggle. */
  expandable?: boolean;
}

/** Drop the trailing "Contractor" from CSLB classification names for display. */
function prettyLabel(label: string): string {
  return label.replace(/\s+Contractor\s*$/i, "").trim() || label;
}

/**
 * Classification pills on the contractor detail page. Each pill pulls
 * from the shared trade palette (lib/trade-colors.ts) so the same
 * color language from the search card carries through to the detail
 * view — plumbers stay blue, roofers stay red, etc.
 */
export default function ClassificationTags({ labels, max, expandable }: Props) {
  const list = labels ?? [];
  const [expanded, setExpanded] = useState(false);

  if (list.length === 0) {
    return <span className="text-xs text-ink-soft">No classifications listed</span>;
  }

  const shouldTruncate = typeof max === "number" && list.length > max;
  const showAll = expanded || !shouldTruncate;
  const shown = showAll ? list : list.slice(0, max);
  const remaining = list.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((label) => {
        const style = getTradeStyle(label);
        return (
          <span
            key={label}
            className={`inline-flex items-center h-6 px-2 rounded-sm text-[11px] font-medium leading-none ${style.bg} ${style.text}`}
            title={label}
          >
            {prettyLabel(label)}
          </span>
        );
      })}

      {shouldTruncate && expandable ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
          className="relative z-10 inline-flex items-center h-6 px-2 rounded-sm text-[11px] font-medium leading-none bg-white border border-gray-200 text-ink-secondary hover:border-gray-300 transition-colors"
        >
          {expanded ? "Show less" : `+${remaining} more`}
        </button>
      ) : remaining > 0 ? (
        <span className="inline-flex items-center h-6 px-2 rounded-sm text-[11px] font-medium leading-none bg-white border border-gray-200 text-ink-secondary">
          +{remaining} more
        </span>
      ) : null}
    </div>
  );
}
