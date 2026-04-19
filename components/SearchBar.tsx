"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface Props {
  initialLocation?: string;
  initialTrade?: string;
  /** Hero uses "lg"; the search page header uses "md" (default). */
  size?: "md" | "lg";
}

export default function SearchBar({
  initialLocation = "",
  initialTrade = "",
  size = "md",
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

  const inputCls = size === "lg" ? "input input-lg" : "input";
  const btnCls = size === "lg" ? "btn-primary btn-lg" : "btn-primary";

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] p-2 rounded-lg border border-line bg-white shadow-card"
      role="search"
    >
      <Field
        icon={<MapPinIcon />}
        placeholder="City or county"
        ariaLabel="Location"
        value={location}
        onChange={setLocation}
        inputCls={inputCls}
      />
      <Field
        icon={<WrenchIcon />}
        placeholder="Trade (e.g. plumbing, roofing)"
        ariaLabel="Trade"
        value={trade}
        onChange={setTrade}
        inputCls={inputCls}
      />
      <button type="submit" className={`${btnCls} sm:px-6`}>
        Search
      </button>
    </form>
  );
}

function Field({
  icon,
  placeholder,
  ariaLabel,
  value,
  onChange,
  inputCls,
}: {
  icon: React.ReactNode;
  placeholder: string;
  ariaLabel: string;
  value: string;
  onChange: (v: string) => void;
  inputCls: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{ariaLabel}</span>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
        {icon}
      </span>
      <input
        type="text"
        aria-label={ariaLabel}
        className={`${inputCls} pl-9 border-transparent bg-surface-subtle focus:bg-white`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function MapPinIcon() {
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

function WrenchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M13.78 2.22a4 4 0 0 0-5.02 5.02L2.3 13.7a1.5 1.5 0 0 0 2.12 2.12l6.46-6.46a4 4 0 0 0 5.02-5.02l-2.12 2.12-1.77-1.77 2.12-2.12-.35-.35ZM4.5 15a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
  );
}
