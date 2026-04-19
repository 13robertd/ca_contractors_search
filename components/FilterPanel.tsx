"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Props {
  counties: string[];
  primaryTrades: string[];
}

export default function FilterPanel({ counties, primaryTrades }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const initial = useMemo(
    () => ({
      activeOnly: params.get("active") !== "0",
      county: params.get("county") ?? "",
      primaryTrade: params.get("primaryTrade") ?? "",
    }),
    [params]
  );

  const [activeOnly, setActiveOnly] = useState(initial.activeOnly);
  const [county, setCounty] = useState(initial.county);
  const [primaryTrade, setPrimaryTrade] = useState(initial.primaryTrade);

  useEffect(() => {
    setActiveOnly(initial.activeOnly);
    setCounty(initial.county);
    setPrimaryTrade(initial.primaryTrade);
  }, [initial.activeOnly, initial.county, initial.primaryTrade]);

  function apply(next: Partial<{ activeOnly: boolean; county: string; primaryTrade: string }>) {
    const merged = {
      activeOnly: next.activeOnly ?? activeOnly,
      county: next.county ?? county,
      primaryTrade: next.primaryTrade ?? primaryTrade,
    };
    const sp = new URLSearchParams(params.toString());

    if (merged.activeOnly) sp.delete("active");
    else sp.set("active", "0");

    if (merged.county) sp.set("county", merged.county);
    else sp.delete("county");

    if (merged.primaryTrade) sp.set("primaryTrade", merged.primaryTrade);
    else sp.delete("primaryTrade");

    router.push(`/search?${sp.toString()}`);
  }

  function clearAll() {
    setActiveOnly(true);
    setCounty("");
    setPrimaryTrade("");
    const sp = new URLSearchParams(params.toString());
    sp.delete("active");
    sp.delete("county");
    sp.delete("primaryTrade");
    router.push(`/search${sp.toString() ? `?${sp.toString()}` : ""}`);
  }

  const activeFilterCount =
    (county ? 1 : 0) + (primaryTrade ? 1 : 0) + (activeOnly ? 0 : 1);

  return (
    <aside className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 text-ink">Filters</h2>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-ink-muted hover:text-ink transition-colors"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {/* Active toggle — styled like a pill toggle */}
      <label className="flex items-start justify-between gap-3 cursor-pointer group">
        <div>
          <div className="text-sm font-medium text-ink">Active licenses only</div>
          <div className="text-xs text-ink-soft mt-0.5">
            Hide suspended, revoked, and expired records.
          </div>
        </div>
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={activeOnly}
          onChange={(e) => {
            setActiveOnly(e.target.checked);
            apply({ activeOnly: e.target.checked });
          }}
        />
        <span
          aria-hidden
          className="mt-0.5 relative inline-flex h-5 w-9 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-ink"
        >
          <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4 [input:checked~&_]:translate-x-4" />
        </span>
      </label>

      <Divider />

      <div>
        <label className="block text-[11px] uppercase tracking-wide font-medium text-ink-soft mb-1.5">
          County
        </label>
        <select
          className="select"
          value={county}
          onChange={(e) => {
            setCounty(e.target.value);
            apply({ county: e.target.value });
          }}
        >
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wide font-medium text-ink-soft mb-1.5">
          Primary trade
        </label>
        <select
          className="select"
          value={primaryTrade}
          onChange={(e) => {
            setPrimaryTrade(e.target.value);
            apply({ primaryTrade: e.target.value });
          }}
        >
          <option value="">All trades</option>
          {primaryTrades.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

function Divider() {
  return <div className="-mx-5 border-t border-line" />;
}
