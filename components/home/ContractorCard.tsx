"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import type { MockContractor } from "@/lib/mockContractors";
import LicenseVariant from "./LicenseVariant";
import TradeVariant, { tradeSubtitle } from "./TradeVariant";

export type CardVariant = "license" | "trade";
export type CardSize = "default" | "compact";

interface Props {
  contractor: MockContractor;
  variant: CardVariant;
  size?: CardSize;
}

/**
 * Unified outer shell for homepage contractor cards. Dispatches the
 * image area to the correct variant component, renders the heart
 * overlay, and renders the bottom meta (company name + subtitle).
 */
export default function ContractorCard({
  contractor: c,
  variant,
  size = "default",
}: Props) {
  const [saved, setSaved] = useState(false);
  const [pulse, setPulse] = useState(false);

  const href = `/contractor/${encodeURIComponent(c.licenseNumber)}`;
  const isCompact = size === "compact";

  // Both variants share the same subtitle rules (trade name / trades list /
  // "General · …" for Generalists). Consistent under a mixed grid.
  const subtitle = tradeSubtitle(c, size);

  function toggleSaved(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaved((v) => !v);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 240);
  }

  // Hover filters differ by variant (brighten dark tile, slightly darken cream tile).
  const hoverFilter =
    variant === "license"
      ? "group-hover:brightness-[1.04]"
      : "group-hover:brightness-[0.98]";

  const radius = isCompact ? "rounded-[10px]" : "rounded-[12px]";
  const imageBg = variant === "license" ? "bg-credential" : "";
  const heartOffset = variant === "license" ? "top-3 right-3" : "top-2 right-2";
  const heartSize = variant === "license" ? 22 : 18;

  const topPadding = isCompact ? "pt-[7px]" : "pt-[7px]";
  const titleSize = isCompact ? "text-[12px]" : "text-[14px]";
  const subtitleSize = isCompact ? "text-[11px]" : "text-[13px]";

  return (
    <Link
      href={href}
      aria-label={`${c.companyName} — CSLB license ${c.licenseNumber}`}
      className={`group block ${radius} focus-brand`}
    >
      {/* Image area (aspect-square) */}
      <div
        className={`relative aspect-square ${radius} overflow-hidden ${imageBg} transition-[filter] duration-[250ms] ${hoverFilter}`}
      >
        {variant === "license" ? (
          <LicenseVariant contractor={c} size={size} />
        ) : (
          <TradeVariant contractor={c} size={size} />
        )}

        {/* Heart button (both variants) */}
        <button
          type="button"
          onClick={toggleSaved}
          aria-label={saved ? `Unsave ${c.companyName}` : `Save ${c.companyName}`}
          aria-pressed={saved}
          className={`absolute ${heartOffset} inline-flex items-center justify-center rounded-full focus-brand`}
        >
          <Heart
            size={heartSize}
            strokeWidth={1.8}
            className={`transition-colors ${pulse ? "heart-pulse" : ""}`}
            style={{
              color: "#FFFFFF",
              fill: saved ? "#B91C1C" : "rgba(0,0,0,0.3)",
            }}
          />
        </button>
      </div>

      {/* Bottom meta */}
      <div className={topPadding}>
        <h3 className={`${titleSize} font-medium text-ink-hero truncate`}>
          {c.companyName}
        </h3>
        <p className={`mt-0.5 ${subtitleSize} text-ink-secondary truncate`}>
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

