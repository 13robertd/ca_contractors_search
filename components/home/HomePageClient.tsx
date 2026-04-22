"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Briefcase,
  Droplet,
  Home,
  Paintbrush,
  Snowflake,
  Trees,
  Zap,
  type LucideIcon,
} from "lucide-react";
import ContractorSection from "@/components/home/ContractorSection";
import HomeSearchBar from "@/components/home/HomeSearchBar";
import WhyFixdStrip from "@/components/home/WhyFixdStrip";
import { MOCK_CONTRACTORS, type MockContractor } from "@/lib/mockContractors";

/** "Newly licensed" window: last 24 months from today. */
const NEWLY_LICENSED_WINDOW_MS = 24 * 30 * 24 * 60 * 60 * 1000;

interface Props {
  /** Geolocation city — sections, chips, See all, and hero default location. */
  sectionCity: string;
  searchCity: string;
  /** From Supabase `contractors` count (head). */
  contractorCount: number;
}

export default function HomePageClient({
  sectionCity,
  searchCity,
  contractorCount,
}: Props) {
  const cityQ = encodeURIComponent(sectionCity);

  const plumbingSection = useMemo(
    () =>
      sortByYearsDesc(
        byPrimary(MOCK_CONTRACTORS, "plumbing", { primaryTradeOnly: true })
      ).slice(0, 8),
    []
  );
  const generalSection = useMemo(
    () =>
      sortByYearsDesc(
        MOCK_CONTRACTORS.filter((c) => c.type === "generalist")
      ).slice(0, 8),
    []
  );
  const electricalSection = useMemo(
    () =>
      sortByYearsDesc(
        byPrimary(MOCK_CONTRACTORS, "electrical", { primaryTradeOnly: true })
      ).slice(0, 8),
    []
  );
  const newlyLicensedSection = useMemo(() => {
    const cutoff = Date.now() - NEWLY_LICENSED_WINDOW_MS;
    return MOCK_CONTRACTORS.filter(
      (c) => c.status === "active" && Date.parse(c.issueDate) >= cutoff
    )
      .sort((a, b) => Date.parse(b.issueDate) - Date.parse(a.issueDate))
      .slice(0, 8);
  }, []);

  return (
    <div className="bg-white">
      <section>
        <div className="page-container pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[36px] sm:text-[44px] font-medium leading-[1.1] text-ink-hero tracking-[-0.02em]">
              Find a licensed contractor you can trust.
            </h1>
            <p className="mt-3 text-[15px] text-ink-secondary">
              Every listing is verified against California CSLB public records.
            </p>
          </div>

          <div className="mt-8 max-w-3xl mx-auto">
            <HomeSearchBar size="lg" defaultLocation={searchCity} />
          </div>

          <TrustStatBar contractorCount={contractorCount} />

          <PopularNearYou city={sectionCity} />
        </div>
      </section>

      <section>
        <div className="page-container">
          <ContractorSection
            title={`Established plumbers in ${sectionCity}`}
            subtitle="20+ years in business, credentials verified"
            contractors={plumbingSection}
            seeAllHref={`/search?trade=plumbing&sort=yearsDesc&location=${cityQ}`}
          />
          <ContractorSection
            title={`Established general contractors in ${sectionCity}`}
            subtitle="20+ years in business, credentials verified"
            contractors={generalSection}
            seeAllHref={`/search?trade=general&sort=yearsDesc&location=${cityQ}`}
          />

          <WhyFixdStrip />

          <ContractorSection
            title={`Established electricians in ${sectionCity}`}
            subtitle="20+ years in business, credentials verified"
            contractors={electricalSection}
            seeAllHref={`/search?trade=electrical&sort=yearsDesc&location=${cityQ}`}
          />
          <ContractorSection
            title={`Newly licensed in ${sectionCity}`}
            subtitle="Recently added to the CSLB registry — verify before hiring"
            contractors={newlyLicensedSection}
            seeAllHref={`/search?sort=newestFirst&location=${cityQ}`}
          />
        </div>
      </section>
    </div>
  );
}

function TrustStatBar({ contractorCount }: { contractorCount: number }) {
  const n = contractorCount.toLocaleString();
  return (
    <div
      className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-1 gap-y-1 px-2 text-center text-[13px] text-ink-secondary sm:text-[14px]"
      role="status"
      aria-live="polite"
    >
      <span className="tabular-nums font-medium text-ink-hero">{n}</span>
      <span> contractor records in our index</span>
      <span className="select-none px-1 text-ink-tertiary" aria-hidden>
        ·
      </span>
      <span>Data from California CSLB</span>
      <span className="select-none px-1 text-ink-tertiary" aria-hidden>
        ·
      </span>
      <span>No subscription to search</span>
    </div>
  );
}

type PopularLink = { href: string; label: string; icon: LucideIcon };

function PopularNearYou({ city }: { city: string }) {
  const cityParam = encodeURIComponent(city);
  const links: PopularLink[] = [
    {
      href: `/search?location=${cityParam}&trade=plumbing&minYears=20`,
      label: "Established plumbers",
      icon: Droplet,
    },
    {
      href: `/search?location=${cityParam}&trade=roofing`,
      label: "Roofers",
      icon: Home,
    },
    {
      href: `/search?location=${cityParam}&trade=electrical`,
      label: "Electricians",
      icon: Zap,
    },
    {
      href: `/search?location=${cityParam}&trade=hvac`,
      label: "HVAC",
      icon: Snowflake,
    },
    {
      href: `/search?location=${cityParam}&trade=painting`,
      label: "Painters",
      icon: Paintbrush,
    },
    {
      href: `/search?location=${cityParam}&trade=general`,
      label: "General contractors",
      icon: Briefcase,
    },
    {
      href: `/search?location=${cityParam}&trade=landscape`,
      label: "Landscapers",
      icon: Trees,
    },
  ];

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
          Popular near you
        </p>
        <p className="mt-1 text-[14px] text-ink-secondary">
          Curated searches in{" "}
          <span className="font-medium text-ink-hero">{city}</span>
        </p>
      </div>
      <div
        className={[
          "no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1",
          "snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0",
        ].join(" ")}
      >
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex shrink-0 snap-start items-center gap-2 rounded-full border border-line-subtle bg-white px-3 py-2 text-[13px] font-medium text-ink-secondary shadow-sm transition-colors hover:border-ink-hero hover:text-ink-hero focus-brand sm:shadow-none"
          >
            <Icon
              size={18}
              strokeWidth={2}
              className="shrink-0 text-ink-tertiary"
              aria-hidden
            />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface PrimaryFilterOpts {
  primaryTradeOnly?: boolean;
}

function byPrimary(
  list: MockContractor[],
  trade: string,
  opts: PrimaryFilterOpts = {}
): MockContractor[] {
  return list.filter((c) => {
    if (c.primaryTrade !== trade) return false;
    if (opts.primaryTradeOnly && c.type === "generalist") return false;
    return true;
  });
}

function sortByYearsDesc(list: MockContractor[]): MockContractor[] {
  return [...list].sort((a, b) => b.yearsInBusiness - a.yearsInBusiness);
}
