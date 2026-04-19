"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface Props {
  initialLocation?: string;
  initialTrade?: string;
  compact?: boolean;
}

export default function SearchBar({
  initialLocation = "",
  initialTrade = "",
  compact = false,
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

  return (
    <form
      onSubmit={onSubmit}
      className={`card p-2 sm:p-3 grid gap-2 ${
        compact ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-[1fr_1fr_auto]"
      }`}
    >
      <label className="relative block">
        <span className="sr-only">Location</span>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          📍
        </span>
        <input
          className="input pl-8"
          placeholder="City or county (e.g. Los Angeles)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>

      <label className="relative block">
        <span className="sr-only">Trade</span>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          🔧
        </span>
        <input
          className="input pl-8"
          placeholder="Trade (e.g. plumbing, roofing)"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
        />
      </label>

      <button type="submit" className="btn-primary sm:px-6">
        Search
      </button>
    </form>
  );
}
