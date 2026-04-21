"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  SearchPill,
  SearchSegment,
  SearchSegmentDivider,
} from "@/components/ui";

interface Props {
  /** Visual size — `lg` is used as the hero; `md` is the expanded nav dropdown. */
  size?: "md" | "lg";
  defaultLocation?: string;
  defaultTrade?: string;
  defaultWhen?: string;
}

/**
 * Homepage hero search. Thin composition over the shared <SearchPill> +
 * <SearchSegment> primitives — this file only owns the field state and
 * the submit → `/search?…` navigation.
 */
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
    <SearchPill size={size} onSubmit={onSubmit}>
      <SearchSegment
        id="location"
        label="Where"
        placeholder="Anywhere"
        value={location}
        onChange={setLocation}
        rounded="left"
      />
      <SearchSegmentDivider between={["location", "trade"]} />
      <SearchSegment
        id="trade"
        label="Trade"
        placeholder="Any trade"
        value={trade}
        onChange={setTrade}
      />
      <SearchSegmentDivider between={["trade", "when"]} />
      <SearchSegment
        id="when"
        label="When"
        placeholder="Any time"
        value={when}
        onChange={setWhen}
        rounded="right"
        paddingRight="pr-2"
      />
    </SearchPill>
  );
}
