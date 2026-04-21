"use client";

import { useEffect, useState } from "react";
import { isSaved, toggleSaved } from "@/lib/savedContractors";

interface Props {
  licenseNumber: string;
  variant?: "icon" | "full";
  className?: string;
}

export default function SaveContractorButton({
  licenseNumber,
  variant = "full",
  className = "",
}: Props) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSaved(isSaved(licenseNumber));
    const refresh = () => setSaved(isSaved(licenseNumber));
    window.addEventListener("saved-contractors-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("saved-contractors-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [licenseNumber]);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleSaved(licenseNumber));
  }

  const active = mounted && saved;

  if (variant === "icon") {
    // Matches the home page's 32×32 circle-icon-button pattern (the nav
    // menu button) — white surface, line-subtle border, brand-red on saved.
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? "Unsave contractor" : "Save contractor"}
        title={active ? "Saved" : "Save"}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-brand ${
          active
            ? "bg-brand border border-brand text-white hover:bg-brand-hover"
            : "bg-white border border-line-subtle text-ink-hero hover:bg-surface-subtle"
        } ${className}`}
      >
        <BookmarkIcon filled={active} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`btn ${active ? "bg-ink text-white hover:bg-fixd-hover" : "bg-white border border-line text-ink hover:bg-surface-subtle"} ${className}`}
    >
      <BookmarkIcon filled={active} />
      <span>{active ? "Saved" : "Save"}</span>
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M5 3a2 2 0 0 0-2 2v13l7-3.2L17 18V5a2 2 0 0 0-2-2H5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M5 3.75A1.75 1.75 0 0 1 6.75 2h6.5A1.75 1.75 0 0 1 15 3.75v14l-5-2.4-5 2.4v-14Z" strokeLinejoin="round" />
    </svg>
  );
}
