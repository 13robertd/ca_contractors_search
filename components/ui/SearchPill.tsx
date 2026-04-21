"use client";

import { createContext, useContext, useState } from "react";
import { Search } from "lucide-react";

/**
 * Shared pill-shaped search bar used by the homepage hero and the /search
 * sticky header. Owns the shell (pill, border, shadow, submit button) and
 * the cross-segment hover/dim state via React context so segments stay
 * drop-in composable (see SearchSegment).
 *
 * Usage:
 *   <SearchPill size="lg" onSubmit={…}>
 *     <SearchSegment id="where" label="Where" rounded="left" … />
 *     <SearchSegmentDivider between={["where","trade"]} />
 *     <SearchSegment id="trade" label="Trade" … />
 *     <SearchSegmentDivider between={["trade","when"]} />
 *     <SearchSegment id="when" label="When" rounded="right" paddingRight="pr-2" … />
 *   </SearchPill>
 */

export type SearchPillSize = "md" | "lg";

interface HoverCtx {
  hovered: string | null;
  setHovered: (v: string | null) => void;
  size: SearchPillSize;
}

const HoverContext = createContext<HoverCtx | null>(null);

/** Segments read hover state off the pill through this hook. */
export function useSearchSegmentState(id: string) {
  const ctx = useContext(HoverContext);
  if (!ctx) {
    throw new Error("SearchSegment must be rendered inside <SearchPill>.");
  }
  return {
    isHovered: ctx.hovered === id,
    isDimmed: ctx.hovered !== null && ctx.hovered !== id,
    onEnter: () => ctx.setHovered(id),
    size: ctx.size,
  };
}

/** Dividers fade out when adjacent to the hovered segment. */
export function useSearchDividerFade(between: [string, string]) {
  const ctx = useContext(HoverContext);
  if (!ctx) {
    throw new Error("SearchSegmentDivider must be rendered inside <SearchPill>.");
  }
  return ctx.hovered !== null && between.includes(ctx.hovered);
}

interface Props {
  size?: SearchPillSize;
  onSubmit?: (e: React.FormEvent) => void;
  submitAriaLabel?: string;
  submitDisabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function SearchPill({
  size = "md",
  onSubmit,
  submitAriaLabel = "Search",
  submitDisabled = false,
  children,
  className = "",
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const height = size === "lg" ? "h-16" : "h-14";
  const btnSize = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize = size === "lg" ? 20 : 18;

  return (
    <form
      onSubmit={onSubmit}
      onMouseLeave={() => setHovered(null)}
      role="search"
      className={`relative flex items-center ${height} rounded-full bg-white border border-line-subtle shadow-search-expanded ${className}`}
    >
      <HoverContext.Provider value={{ hovered, setHovered, size }}>
        {children}
        <div className="pr-2">
          <button
            type="submit"
            aria-label={submitAriaLabel}
            disabled={submitDisabled}
            className={`inline-flex items-center justify-center ${btnSize} rounded-full bg-brand hover:bg-brand-hover text-white transition-colors focus-brand disabled:opacity-60`}
          >
            <Search size={iconSize} strokeWidth={2.5} />
          </button>
        </div>
      </HoverContext.Provider>
    </form>
  );
}
