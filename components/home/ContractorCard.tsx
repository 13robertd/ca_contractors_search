"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import type { MockContractor } from "@/lib/mockContractors";
import LicenseCard from "./LicenseCard";

interface Props {
  contractor: MockContractor;
  /** Optional: multiple "slides" (e.g. map view, work photos) for the bottom dots. */
  slideCount?: number;
}

export default function ContractorCard({ contractor: c, slideCount = 1 }: Props) {
  const [saved, setSaved] = useState(false);
  const [pulse, setPulse] = useState(false);

  const href = `/contractor/${encodeURIComponent(c.licenseNumber)}`;

  // Trust summary: "{class} · {years} yrs[ · Bonded]"
  const trustSummary = [
    c.classificationLabel,
    `${c.yearsInBusiness} yrs`,
    c.bonded ? "Bonded" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const locationLine = c.neighborhood ? `${c.city} · ${c.neighborhood}` : c.city;

  function toggleSaved(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaved((v) => !v);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 240);
  }

  return (
    <Link
      href={href}
      aria-label={`${c.companyName} — CSLB license ${c.licenseNumber}`}
      className="group block rounded-[12px] focus-brand"
    >
      {/* License-card image area */}
      <div className="relative aspect-square rounded-[12px] overflow-hidden bg-credential transition-[filter] duration-[250ms] group-hover:brightness-[1.04]">
        <LicenseCard contractor={c} />

        {/* Heart overlay */}
        <button
          type="button"
          onClick={toggleSaved}
          aria-label={saved ? `Unsave ${c.companyName}` : `Save ${c.companyName}`}
          aria-pressed={saved}
          className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full focus-brand"
        >
          <Heart
            size={22}
            strokeWidth={1.8}
            className={`transition-colors ${pulse ? "heart-pulse" : ""}`}
            style={{
              color: "#FFFFFF",
              fill: saved ? "#B91C1C" : "rgba(0,0,0,0.3)",
            }}
          />
        </button>

        {/* Carousel dots — hidden if only one slide */}
        {slideCount > 1 ? (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
            {Array.from({ length: Math.min(slideCount, 3) }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === 0 ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Meta */}
      <div className="pt-[10px]">
        <h3 className="text-[15px] font-medium text-ink-hero truncate">
          {c.companyName}
        </h3>
        <p className="mt-0.5 text-[14px] text-ink-secondary truncate">
          {locationLine}
        </p>
        <p className="mt-0.5 text-[14px] text-ink-secondary truncate">
          {trustSummary}
        </p>
      </div>
    </Link>
  );
}
