"use client";

import type { MockContractor } from "@/lib/mockContractors";
import { SectionHeading } from "@/components/ui";
import ContractorCardBase from "@/components/cards/ContractorCardBase";
import { cardDataFromMock } from "@/lib/cardData";

interface Props {
  title: string;
  subtitle?: string;
  contractors: MockContractor[];
  seeAllHref: string;
}

/**
 * Horizontal homepage section: title row + see-all affordance, then the
 * shared contractor card in "preview" density — a lighter version of the
 * same card system used on /search.
 *
 * Hidden when fewer than 3 contractors qualify (parent just hands us an
 * unfiltered list).
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
      <SectionHeading
        title={title}
        subtitle={subtitle}
        seeAllHref={seeAllHref}
      />

      {/* Horizontal rail on mobile, responsive grid on tablet/desktop. */}
      <div className="mt-[18px] -mx-4 sm:mx-0 flex overflow-x-auto no-scrollbar snap-x snap-mandatory sm:overflow-visible sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 px-4 sm:px-0 gap-3">
        {contractors.map((c) => (
          <div
            key={c.licenseNumber}
            className="shrink-0 snap-start w-[70vw] max-w-[280px] sm:w-auto sm:max-w-none"
          >
            <ContractorCardBase
              data={cardDataFromMock(c)}
              variant="preview"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
