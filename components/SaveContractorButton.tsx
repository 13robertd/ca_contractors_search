"use client";

import { useEffect, useState } from "react";
import { isSaved, toggleSaved } from "@/lib/savedContractors";

interface Props {
  licenseNumber: string;
  variant?: "icon" | "full";
  className?: string;
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
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
    const next = toggleSaved(licenseNumber);
    setSaved(next);
  }

  // Avoid hydration mismatch — don't render saved state until mounted.
  const active = mounted && saved;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={active ? "Unsave contractor" : "Save contractor"}
        title={active ? "Saved" : "Save"}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          active
            ? "border-brand-500 bg-brand-50 text-brand-500"
            : "border-hairline bg-surface text-ink-muted hover:text-brand-500 hover:border-brand-200"
        } ${className}`}
      >
        <Heart filled={active} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn ${
        active
          ? "border border-brand-500 bg-brand-50 text-brand-600 hover:bg-brand-100"
          : "border border-hairline bg-surface text-ink hover:bg-surface-alt"
      } ${className}`}
    >
      <Heart filled={active} />
      <span>{active ? "Saved" : "Save"}</span>
    </button>
  );
}
