"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

/**
 * /search sticky search bar. Matches the home page's <HomeSearchBar />
 * design language exactly — pill shape, segment labels on top of values,
 * hairline dividers, crimson circular button — adapted for 4 segments
 * (Where / Service / When / Keyword).
 */

type SegmentId = "location" | "service" | "when" | "keyword";

interface Props {
  initialLocation?: string;
  initialTrade?: string;
  initialKeyword?: string;
  initialWhen?: string;
}

const WHEN_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "asap", label: "ASAP" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "flexible", label: "Flexible" },
];

export default function MarketplaceSearchBar({
  initialLocation = "",
  initialTrade = "",
  initialKeyword = "",
  initialWhen = "",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [location, setLocation] = useState(initialLocation);
  const [trade, setTrade] = useState(initialTrade);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [when, setWhen] = useState(initialWhen);
  const [hovered, setHovered] = useState<SegmentId | null>(null);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const sp = new URLSearchParams();
    if (location.trim()) sp.set("location", location.trim());
    if (trade.trim()) sp.set("trade", trade.trim());
    if (keyword.trim()) sp.set("q", keyword.trim());
    if (when) sp.set("when", when);
    startTransition(() => {
      router.push(`/search?${sp.toString()}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Find contractors"
      className="w-full"
    >
      {/* Pill search bar — same token set as HomeSearchBar */}
      <div
        onMouseLeave={() => setHovered(null)}
        className="relative flex items-center h-14 rounded-full bg-white border border-line-subtle shadow-search-expanded"
      >
        <Segment
          id="location"
          label="Where"
          placeholder="City or ZIP"
          value={location}
          onChange={setLocation}
          hovered={hovered}
          onHover={setHovered}
          rounded="left"
        />

        <Divider hovered={hovered} between={["location", "service"]} />

        <Segment
          id="service"
          label="Service"
          placeholder="Plumber, roofer…"
          value={trade}
          onChange={setTrade}
          hovered={hovered}
          onHover={setHovered}
        />

        <Divider hovered={hovered} between={["service", "when"]} />

        <SelectSegment
          id="when"
          label="When"
          value={when}
          onChange={setWhen}
          options={WHEN_OPTIONS}
          hovered={hovered}
          onHover={setHovered}
        />

        <Divider hovered={hovered} between={["when", "keyword"]} />

        <Segment
          id="keyword"
          label="Keyword"
          placeholder="Bond, solar…"
          value={keyword}
          onChange={setKeyword}
          hovered={hovered}
          onHover={setHovered}
          rounded="right"
          paddingRight="pr-2"
        />

        <div className="pr-2">
          <button
            type="submit"
            disabled={pending}
            aria-label="Search"
            className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand hover:bg-brand-hover text-white transition-colors focus-brand disabled:opacity-60"
          >
            <Search size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Secondary row — Filters button matches nav "Saved" link styling */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Open filters"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-line-subtle bg-white hover:bg-surface-subtle text-[13px] font-medium text-ink-hero transition-colors focus-brand"
        >
          <SlidersHorizontal size={14} strokeWidth={2} aria-hidden />
          Filters
        </button>
        <span className="hidden sm:inline text-[13px] text-ink-secondary">
          Showing licensed and verified contractors near you
        </span>
      </div>
    </form>
  );
}

/* ---------- Segments ---------- */

interface BaseSegmentProps {
  id: SegmentId;
  label: string;
  hovered: SegmentId | null;
  onHover: (v: SegmentId | null) => void;
  rounded?: "left" | "right";
  paddingRight?: string;
}

function Segment({
  id,
  label,
  placeholder,
  value,
  onChange,
  hovered,
  onHover,
  rounded,
  paddingRight,
}: BaseSegmentProps & {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { rounding, bg, dim } = segmentState(id, hovered, rounded);

  return (
    <label
      onMouseEnter={() => onHover(id)}
      className={`group flex-1 min-w-0 h-full flex flex-col justify-center cursor-text px-5 ${
        paddingRight ?? ""
      } ${rounding} transition-colors ${bg} ${dim}`}
    >
      <span className="text-[11px] font-medium text-ink-hero">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 w-full bg-transparent border-0 outline-none text-[13px] text-ink-hero placeholder:text-ink-tertiary"
      />
    </label>
  );
}

function SelectSegment({
  id,
  label,
  value,
  onChange,
  options,
  hovered,
  onHover,
  rounded,
}: BaseSegmentProps & {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const { rounding, bg, dim } = segmentState(id, hovered, rounded);

  return (
    <label
      onMouseEnter={() => onHover(id)}
      className={`group flex-1 min-w-0 h-full flex flex-col justify-center cursor-pointer px-5 ${rounding} transition-colors ${bg} ${dim}`}
    >
      <span className="text-[11px] font-medium text-ink-hero">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full bg-transparent border-0 outline-none text-[13px] text-ink-hero cursor-pointer appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function segmentState(
  id: SegmentId,
  hovered: SegmentId | null,
  rounded?: "left" | "right"
) {
  const isHovered = hovered === id;
  const isDimmed = hovered !== null && hovered !== id;
  return {
    rounding:
      rounded === "left"
        ? "rounded-l-full"
        : rounded === "right"
        ? "rounded-r-full"
        : "",
    bg: isHovered ? "bg-surface-subtle" : "",
    dim: isDimmed ? "opacity-60" : "",
  };
}

function Divider({
  hovered,
  between,
}: {
  hovered: SegmentId | null;
  between: [SegmentId, SegmentId];
}) {
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
