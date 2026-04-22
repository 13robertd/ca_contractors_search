"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MockContractor } from "@/lib/mockContractors";
import { SectionHeading } from "@/components/ui";
import ContractorCard from "@/components/ContractorCard";
import { cardDataFromMock } from "@/lib/cardData";

/** One card (`w-80`) + `gap-4` — used for desktop chevron scroll steps. */
const SCROLL_STEP_PX = 336;

interface Props {
  title: string;
  subtitle?: string;
  contractors: MockContractor[];
  /** “See all” arrow in the section header — links into /search. */
  seeAllHref?: string;
}

/**
 * Homepage section: H2 + subtitle (same horizontal padding as the rail),
 * then a horizontal scroller of <ContractorCard> (w-80, fillGridCell).
 * Scrollbar hidden (`.no-scrollbar`), snap-mandatory, desktop chevrons on
 * hover (md+).
 */
export default function ContractorSection({
  title,
  subtitle,
  contractors,
  seeAllHref,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateChevrons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const eps = 6;
    setCanScrollLeft(scrollLeft > eps);
    setCanScrollRight(scrollLeft < maxScroll - eps);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateChevrons();
    el.addEventListener("scroll", updateChevrons, { passive: true });
    const ro = new ResizeObserver(updateChevrons);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateChevrons);
      ro.disconnect();
    };
  }, [contractors, updateChevrons]);

  if (contractors.length < 3) return null;

  return (
    <section className="group relative mb-12 overflow-x-clip">
      <div className="px-6 md:px-12">
        <SectionHeading
          title={title}
          subtitle={subtitle}
          seeAllHref={seeAllHref}
        />
      </div>

      <div className="relative mt-[18px] min-h-0">
        <div
          ref={scrollRef}
          className={[
            "no-scrollbar relative z-0 flex w-full snap-x snap-mandatory items-stretch gap-4",
            "overflow-x-auto overscroll-x-contain scroll-smooth pb-4",
            "pl-6 pr-0 md:pl-12",
            "-mr-4 sm:-mr-6 lg:-mr-8",
          ].join(" ")}
        >
          {contractors.map((c) => (
            <div
              key={c.licenseNumber}
              className="flex h-full min-h-0 w-80 max-w-80 min-w-80 shrink-0 snap-start flex-col"
            >
              <ContractorCard
                fillGridCell
                data={cardDataFromMock(c)}
                className="min-h-0 flex-1"
              />
            </div>
          ))}
        </div>

        {canScrollLeft ? (
          <button
            type="button"
            aria-label="Scroll contractors left"
            onClick={() =>
              scrollRef.current?.scrollBy({
                left: -SCROLL_STEP_PX,
                behavior: "smooth",
              })
            }
            className="pointer-events-none absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 opacity-0 shadow-md transition-opacity hover:bg-gray-50 group-hover:pointer-events-auto group-hover:opacity-100 md:flex"
          >
            <ChevronLeft size={20} strokeWidth={2} aria-hidden />
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            type="button"
            aria-label="Scroll contractors right"
            onClick={() =>
              scrollRef.current?.scrollBy({
                left: SCROLL_STEP_PX,
                behavior: "smooth",
              })
            }
            className="pointer-events-none absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 opacity-0 shadow-md transition-opacity hover:bg-gray-50 group-hover:pointer-events-auto group-hover:opacity-100 md:flex"
          >
            <ChevronRight size={20} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  );
}
