"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface Props {
  initialLocation?: string;
  initialTrade?: string;
  variant?: "default" | "hero";
}

export default function SearchBar({
  initialLocation = "",
  initialTrade = "",
  variant = "default",
}: Props) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [trade, setTrade] = useState(initialTrade);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (trade.trim()) params.set("trade", trade.trim());
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const hero = variant === "hero";

  return (
    <form
      onSubmit={onSubmit}
      className={`bg-surface border border-hairline shadow-card grid gap-2 p-2 sm:p-2 sm:grid-cols-[1fr_1fr_auto] ${
        hero ? "rounded-lg" : "rounded-md"
      }`}
    >
      <label className="relative block">
        <span className="sr-only">Location</span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <input
          className="input pl-10 border-transparent shadow-none focus:border-brand-500"
          placeholder="City or county (e.g. Los Angeles)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>

      <label className="relative block sm:border-l sm:border-hairline sm:pl-1">
        <span className="sr-only">Trade</span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          className="input pl-11 border-transparent shadow-none focus:border-brand-500"
          placeholder="Trade (e.g. plumbing, roofing)"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
        />
      </label>

      <button type="submit" className={`btn-primary ${hero ? "sm:px-7 sm:py-3 sm:text-base" : "sm:px-6"}`}>
        Search
      </button>
    </form>
  );
}
