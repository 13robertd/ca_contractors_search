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
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors ${
          active
            ? "border-amber-300 bg-amber-50 text-amber-600"
            : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
        } ${className}`}
      >
        {active ? "★" : "☆"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn ${
        active
          ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      } ${className}`}
    >
      <span>{active ? "★" : "☆"}</span>
      <span>{active ? "Saved" : "Save"}</span>
    </button>
  );
}
