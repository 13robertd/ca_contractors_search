"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Props {
  counties: string[];
  primaryTrades: string[];
}

/**
 * Filter panel that syncs with the current URL search params.
 * Changing any filter updates the URL, which re-runs the server-side query
 * on the /search page.
 */
export default function FilterPanel({ counties, primaryTrades }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const initial = useMemo(
    () => ({
      activeOnly: params.get("active") !== "0", // default on
      county: params.get("county") ?? "",
      primaryTrade: params.get("primaryTrade") ?? "",
    }),
    [params]
  );

  const [activeOnly, setActiveOnly] = useState(initial.activeOnly);
  const [county, setCounty] = useState(initial.county);
  const [primaryTrade, setPrimaryTrade] = useState(initial.primaryTrade);

  // Keep filters in sync if the URL changes externally (e.g. back/forward).
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

  return (
    <aside className="card p-5 space-y-5 sticky top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Clear
        </button>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          checked={activeOnly}
          onChange={(e) => {
            setActiveOnly(e.target.checked);
            apply({ activeOnly: e.target.checked });
          }}
        />
        <span className="text-sm text-slate-800">Active licenses only</span>
      </label>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">County</label>
        <select
          className="input"
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
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Primary trade
        </label>
        <select
          className="input"
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
