"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

type SegmentId = "location" | "trade" | "when";

interface Props {
  /** Visual size — `lg` is used as the hero; `md` is the expanded nav dropdown. */
  size?: "md" | "lg";
  /** Optional initial values (e.g. when re-expanding from a compact pill). */
  defaultLocation?: string;
  defaultTrade?: string;
  defaultWhen?: string;
}

export default function HomeSearchBar({
  size = "lg",
  defaultLocation = "",
  defaultTrade = "",
  defaultWhen = "",
}: Props) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [trade, setTrade] = useState(defaultTrade);
  const [when, setWhen] = useState(defaultWhen);
  const [hovered, setHovered] = useState<SegmentId | null>(null);

  const height = size === "lg" ? "h-16" : "h-14";
  const btnSize = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const valueFont = size === "lg" ? "text-[14px]" : "text-[13px]";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (trade.trim()) params.set("trade", trade.trim());
    if (when.trim()) params.set("when", when.trim());
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  return (
    <form
      onSubmit={onSubmit}
      onMouseLeave={() => setHovered(null)}
      className={`relative flex items-center ${height} rounded-full bg-white border border-line-subtle shadow-search-expanded`}
    >
      <Segment
        id="location"
        label="Where"
        placeholder="Anywhere"
        value={location}
        onChange={setLocation}
        hovered={hovered}
        onHover={setHovered}
        valueFont={valueFont}
        rounded="left"
      />

      <Divider hovered={hovered} between={["location", "trade"]} />

      <Segment
        id="trade"
        label="Trade"
        placeholder="Any trade"
        value={trade}
        onChange={setTrade}
        hovered={hovered}
        onHover={setHovered}
        valueFont={valueFont}
      />

      <Divider hovered={hovered} between={["trade", "when"]} />

      <Segment
        id="when"
        label="When"
        placeholder="Any time"
        value={when}
        onChange={setWhen}
        hovered={hovered}
        onHover={setHovered}
        valueFont={valueFont}
        rounded="right"
        paddingRight="pr-2"
      />

      <div className="pr-2">
        <button
          type="submit"
          aria-label="Search"
          className={`inline-flex items-center justify-center ${btnSize} rounded-full bg-brand hover:bg-brand-hover text-white transition-colors focus-brand`}
        >
          <Search size={size === "lg" ? 20 : 18} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}

function Segment({
  id,
  label,
  placeholder,
  value,
  onChange,
  hovered,
  onHover,
  valueFont,
  rounded,
  paddingRight,
}: {
  id: SegmentId;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hovered: SegmentId | null;
  onHover: (v: SegmentId | null) => void;
  valueFont: string;
  rounded?: "left" | "right";
  paddingRight?: string;
}) {
  const isHovered = hovered === id;
  const isDimmed = hovered !== null && hovered !== id;

  const roundingCls =
    rounded === "left" ? "rounded-l-full" : rounded === "right" ? "rounded-r-full" : "";

  return (
    <label
      onMouseEnter={() => onHover(id)}
      className={`group flex-1 min-w-0 h-full flex flex-col justify-center cursor-text px-6 ${paddingRight ?? ""} ${roundingCls} transition-colors ${
        isHovered ? "bg-surface-subtle" : ""
      } ${isDimmed ? "opacity-60" : ""}`}
    >
      <span className="text-[11px] font-medium text-ink-hero">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-0.5 w-full bg-transparent border-0 outline-none ${valueFont} text-ink-hero placeholder:text-ink-tertiary`}
      />
    </label>
  );
}

function Divider({
  hovered,
  between,
}: {
  hovered: SegmentId | null;
  between: [SegmentId, SegmentId];
}) {
  // Hide the divider adjacent to a hovered segment, for a cleaner edge.
  const touchesHover = hovered !== null && between.includes(hovered);
  return (
    <span
      aria-hidden
      className={`h-8 w-px bg-line-subtle transition-opacity ${
        touchesHover ? "opacity-0" : "opacity-100"
      }`}
    />
  );
}
