"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
      className="w-full"
      role="search"
      aria-label="Find contractors"
    >
      <div className="flex items-stretch gap-2 rounded-full border border-line bg-white shadow-card pl-2 pr-2 py-1.5">
        <Field
          label="Where"
          icon={<PinIcon />}
          value={location}
          onChange={setLocation}
          placeholder="City or ZIP"
        />
        <Divider />
        <Field
          label="Service"
          icon={<ToolIcon />}
          value={trade}
          onChange={setTrade}
          placeholder="Plumber, roofer…"
        />
        <Divider />
        <SelectField
          label="When"
          icon={<CalendarIcon />}
          value={when}
          onChange={setWhen}
          options={WHEN_OPTIONS}
        />
        <Divider />
        <Field
          label="Keyword"
          icon={<SearchIcon />}
          value={keyword}
          onChange={setKeyword}
          placeholder="Bond, solar…"
          className="hidden md:flex"
        />

        <button
          type="submit"
          aria-label="Search"
          disabled={pending}
          className="ml-auto inline-flex items-center gap-2 self-stretch px-5 rounded-full bg-fixd text-white text-sm font-medium hover:bg-fixd-hover transition-colors shadow-sm disabled:opacity-60"
        >
          <SearchIcon />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-soft">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-line bg-white hover:bg-surface-subtle text-ink transition-colors"
          aria-label="Open filters"
        >
          <FiltersIcon />
          Filters
        </button>
        <span className="hidden sm:inline">
          Showing licensed and verified contractors near you
        </span>
      </div>
    </form>
  );
}

/* ------------ inline subcomponents ------------ */

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={`group flex-1 min-w-0 flex items-center gap-2 px-3 rounded-full hover:bg-surface-subtle transition-colors cursor-text ${className}`}
    >
      <span className="text-ink-soft shrink-0">{icon}</span>
      <span className="flex flex-col min-w-0 py-1">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-ink-soft">
          {label}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 p-0 text-sm text-ink placeholder:text-ink-soft focus:outline-none"
        />
      </span>
    </label>
  );
}

function SelectField({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="group flex-1 min-w-0 flex items-center gap-2 px-3 rounded-full hover:bg-surface-subtle transition-colors cursor-pointer">
      <span className="text-ink-soft shrink-0">{icon}</span>
      <span className="flex flex-col min-w-0 py-1">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-ink-soft">
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-0 p-0 text-sm text-ink focus:outline-none cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function Divider() {
  return <span aria-hidden className="self-center w-px h-7 bg-line" />;
}

/* ------------ icons ------------ */

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18s6-5.5 6-10a6 6 0 1 0-12 0c0 4.5 6 10 6 10Zm0-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function ToolIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M14.7 2.3a3 3 0 0 0-4.05 3.95l-7.4 7.4a1.5 1.5 0 1 0 2.12 2.12l7.4-7.4A3 3 0 0 0 17.7 5.3l-2 2-1.4-1.4 2-2Z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 6H4v8h12V8Z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9 2a7 7 0 1 0 4.192 12.606l3.101 3.1a1 1 0 0 0 1.414-1.414l-3.1-3.1A7 7 0 0 0 9 2Zm-5 7a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function FiltersIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M3 5h14a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2Zm3 4h8a1 1 0 1 1 0 2H6a1 1 0 1 1 0-2Zm3 4h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2Z" />
    </svg>
  );
}
