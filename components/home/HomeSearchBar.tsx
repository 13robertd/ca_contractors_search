"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TRADE_TAXONOMY, type TradeSlug } from "@/lib/trades";

interface Props {
  /** `lg` = homepage hero (card shell). `md` = nav dropdown — same fields, tighter. */
  size?: "md" | "lg";
  defaultLocation?: string;
  defaultTrade?: string;
}

const TRADE_SLUGS = Object.keys(TRADE_TAXONOMY) as TradeSlug[];

/**
 * Homepage + nav search: location + trade (slug) + submit. No “When” on
 * the homepage path — `/search` keeps its own richer bar.
 */
export default function HomeSearchBar({
  size = "lg",
  defaultLocation = "",
  defaultTrade = "",
}: Props) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [trade, setTrade] = useState(defaultTrade);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (trade.trim()) params.set("trade", trade.trim());
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  const fieldClass =
    "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-ink-hero placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

  const rowClass =
    size === "lg"
      ? "flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3"
      : "flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2";

  const shellClass =
    size === "lg"
      ? "rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-3"
      : "";

  const btnClass =
    size === "lg"
      ? "inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-accent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:w-auto"
      : "inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:w-auto";

  return (
    <form onSubmit={onSubmit} className={shellClass}>
      <div className={rowClass}>
        <label className="sr-only" htmlFor={`home-search-location-${size}`}>
          Location
        </label>
        <input
          id={`home-search-location-${size}`}
          name="location"
          type="text"
          autoComplete="address-level2"
          placeholder="City or ZIP"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={`${fieldClass} sm:flex-1`}
        />

        <label className="sr-only" htmlFor={`home-search-trade-${size}`}>
          Trade
        </label>
        <select
          id={`home-search-trade-${size}`}
          name="trade"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          className={`${fieldClass} sm:w-[min(100%,200px)] sm:shrink-0`}
        >
          <option value="">Any trade</option>
          {TRADE_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {TRADE_TAXONOMY[slug].label}
            </option>
          ))}
        </select>

        <button type="submit" className={btnClass}>
          Search
        </button>
      </div>
    </form>
  );
}
