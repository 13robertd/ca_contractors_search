"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  PillButton,
  SearchPill,
  SearchSegment,
  SearchSegmentDivider,
  SearchSegmentSelect,
} from "@/components/ui";

/**
 * /search sticky search bar. Composed from the shared <SearchPill> +
 * <SearchSegment*> primitives so it stays visually 1:1 with <HomeSearchBar />.
 * This file only owns the 4-segment wiring (Where / Service / When / Keyword)
 * plus the secondary Filters row.
 */

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="w-full" aria-label="Find contractors">
      <SearchPill
        size="md"
        onSubmit={submit}
        submitDisabled={pending}
      >
        <SearchSegment
          id="location"
          label="Where"
          placeholder="City or ZIP"
          value={location}
          onChange={setLocation}
          rounded="left"
        />
        <SearchSegmentDivider between={["location", "service"]} />
        <SearchSegment
          id="service"
          label="Service"
          placeholder="Plumber, roofer…"
          value={trade}
          onChange={setTrade}
        />
        <SearchSegmentDivider between={["service", "when"]} />
        <SearchSegmentSelect
          id="when"
          label="When"
          value={when}
          onChange={setWhen}
          options={WHEN_OPTIONS}
        />
        <SearchSegmentDivider between={["when", "keyword"]} />
        <SearchSegment
          id="keyword"
          label="Keyword"
          placeholder="Bond, solar…"
          value={keyword}
          onChange={setKeyword}
          rounded="right"
          paddingRight="pr-2"
        />
      </SearchPill>

      <div className="mt-3 flex items-center justify-between gap-2">
        <PillButton aria-label="Open filters">
          <SlidersHorizontal size={14} strokeWidth={2} aria-hidden />
          Filters
        </PillButton>
        <span className="hidden sm:inline text-[13px] text-ink-secondary">
          Showing licensed and verified contractors near you
        </span>
      </div>
    </div>
  );
}
