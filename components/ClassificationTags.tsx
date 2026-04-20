"use client";

import { useState } from "react";

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
      {shown.map((label) => (
        <span key={label} className="chip" title={label}>
          {prettyLabel(label)}
        </span>
      ))}

      {shouldTruncate && expandable ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
          className="chip bg-white hover:bg-canvas hover:border-line-strong relative z-10 transition-colors"
        >
          {expanded ? "Show less" : `+${remaining} more`}
        </button>
      ) : remaining > 0 ? (
        <span className="chip bg-white">+{remaining} more</span>
      ) : null}
    </div>
  );
}
