"use client";

import type { MockContractor } from "@/lib/mockContractors";
import { SectionHeading } from "@/components/ui";
import ContractorCard, { type CardVariant } from "./ContractorCard";

interface Props {
  title: string;
  subtitle?: string;
  contractors: MockContractor[];
  seeAllHref: string;
  /**
   * All cards in the row render with this variant. Sections are the unit
   * of visual consistency — we don't alternate within a single row.
   */
  variant: CardVariant;
}

/**
 * Horizontal section: title row with an arrow "see all" affordance, then
 * compact cards in a 3-to-4 column responsive grid on tablet/desktop,
 * and a horizontal-scroll rail on mobile (cards ~70vw wide).
 *
 * If `contractors.length < 3` the section renders nothing — parent pages
 * may just hand this an unfiltered list.
 */
export default function ContractorSection({
  title,
  subtitle,
  contractors,
  seeAllHref,
  variant,
}: Props) {
  if (contractors.length < 3) return null;

  return (
    <section className="mb-12">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        seeAllHref={seeAllHref}
      />

      {/* Cards */}
      <div
        className="mt-[18px] -mx-4 sm:mx-0 flex overflow-x-auto no-scrollbar snap-x snap-mandatory sm:overflow-visible sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 px-4 sm:px-0 gap-3"
      >
        {contractors.map((c) => (
          <div
            key={c.licenseNumber}
            className="shrink-0 snap-start w-[70vw] max-w-[280px] sm:w-auto sm:max-w-none"
          >
            <ContractorCard contractor={c} variant={variant} size="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}
