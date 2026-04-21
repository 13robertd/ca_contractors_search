"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MockContractor } from "@/lib/mockContractors";
import ContractorCard from "./ContractorCard";

interface Props {
  title: string;
  subtitle?: string;
  contractors: MockContractor[];
  seeAllHref: string;
}

/**
 * Horizontal section: title row with an arrow "see all" affordance, then
 * compact cards in a 3-to-4 column responsive grid on tablet/desktop,
 * and a horizontal-scroll rail on mobile (cards ~70vw wide).
 *
 * Cards alternate variant (even=license, odd=trade) for visual rhythm.
 *
 * If `contractors.length < 3` the section renders nothing — parent pages
 * may just hand this an unfiltered list.
 */
export default function ContractorSection({
  title,
  subtitle,
  contractors,
  seeAllHref,
}: Props) {
  if (contractors.length < 3) return null;

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex items-center gap-[14px]">
        <h2 className="text-[22px] font-medium text-ink-hero tracking-[-0.3px] m-0">
          {title}
        </h2>
        <Link
          href={seeAllHref}
          aria-label={`See all: ${title}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F1F1] hover:bg-[#E5E5E5] text-ink-hero transition-colors focus-brand"
        >
          <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
      {subtitle ? (
        <p className="mt-1 text-[15px] text-ink-secondary">{subtitle}</p>
      ) : null}

      {/* Cards */}
      <div
        className="mt-[18px] -mx-4 sm:mx-0 flex overflow-x-auto no-scrollbar snap-x snap-mandatory sm:overflow-visible sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 px-4 sm:px-0 gap-3"
      >
        {contractors.map((c, i) => (
          <div
            key={c.licenseNumber}
            className="shrink-0 snap-start w-[70vw] max-w-[280px] sm:w-auto sm:max-w-none"
          >
            <ContractorCard
              contractor={c}
              variant={i % 2 === 0 ? "license" : "trade"}
              size="compact"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
