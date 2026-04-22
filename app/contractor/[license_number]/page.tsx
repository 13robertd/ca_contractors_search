import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Phone } from "lucide-react";
import { getContractorByLicense } from "@/lib/queries";
import { findMockContractor } from "@/lib/mockContractors";
import {
  formatDate,
  formatPhone,
  formatYears,
} from "@/lib/formatters";
import TrustBadgeRow from "@/components/TrustBadgeRow";
import ClassificationTags from "@/components/ClassificationTags";
import SaveContractorButton from "@/components/SaveContractorButton";
import { getTradeStyle } from "@/lib/trade-colors";

/**
 * Contractor detail page. Server component — fetches the contractor row
 * server-side and hands the already-resolved object to a handful of
 * small server-rendered sections. Only the Save button and
 * ClassificationTags are client components (they own interactive state).
 *
 * Design tokens match the homepage and /search: rounded-[12px] cards on
 * `line-subtle` borders, `ink-hero` / `ink-secondary` / `ink-tertiary`
 * type, crimson reserved strictly for actions (phone CTA + link hover).
 */

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ license_number: string }>;
}

/** CSLB public record URL for a given license number. */
function cslbPublicRecordUrl(license: string): string {
  return `https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/LicenseDetail.aspx?LicNum=${encodeURIComponent(
    license
  )}`;
}

/**
 * Map the CSLB `business_type` code (or a pre-expanded label) to a
 * friendly entity-type label. Unknown codes fall through unchanged.
 */
function ownershipLabel(code: string | null): string {
  if (!code) return "Unknown";
  const map: Record<string, string> = {
    SO: "Sole Ownership",
    PT: "Partnership",
    CR: "Corporation",
    LLC: "Limited Liability Company",
    JV: "Joint Venture",
    "Sole Ownership": "Sole Ownership",
    Partnership: "Partnership",
    Corporation: "Corporation",
    "Limited Liability Company": "Limited Liability Company",
    "Joint Venture": "Joint Venture",
  };
  return map[code] ?? code;
}

/**
 * Fetch by license — Supabase first, then fall back to the homepage mock
 * dataset. The homepage's curated sections render from mocks so clicks on
 * those cards land here with license numbers that aren't in the real
 * database yet; the fallback keeps the UX intact until those rows are
 * ingested.
 */
async function loadContractor(license: string) {
  const row = await getContractorByLicense(license).catch((err) => {
    console.error("[Fixd] contractor detail fetch error", err);
    return null;
  });
  return row ?? findMockContractor(license);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { license_number } = await params;
  const license = decodeURIComponent(license_number);
  const c = await loadContractor(license);

  if (!c) {
    return {
      title: "Contractor not found | Fixd",
      robots: { index: false },
    };
  }

  const location = [c.city, c.county ? `${c.county} County` : null]
    .filter(Boolean)
    .join(", ");

  return {
    title: `${c.business_name} — License #${c.license_number} | Fixd`,
    description: `Verified CSLB license details for ${c.business_name}, ${
      c.primary_trade ?? "contractor"
    }${location ? ` in ${location}` : ""}.`,
    robots: { index: false },
  };
}

export default async function ContractorDetailPage({ params }: PageProps) {
  const { license_number } = await params;
  const license = decodeURIComponent(license_number);

  const contractor = await loadContractor(license);

  if (!contractor) notFound();
  const c = contractor;

  const telDigits = c.phone ? c.phone.replace(/\D/g, "") : "";
  const telHref = telDigits ? `tel:${telDigits}` : null;
  const publicRecordUrl = cslbPublicRecordUrl(c.license_number);
  const fullAddress = [c.address, c.city, c.state, c.zip_code]
    .filter(Boolean)
    .join(", ");

  // Trade color for the header's left border + icon — same palette
  // driving the card grid on /search, so a blue card leads to a
  // blue-anchored detail page.
  const trade = getTradeStyle(c.primary_trade);
  const TradeIcon = trade.icon;

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)]">
      <div className="page-container max-w-4xl py-6 sm:py-10">
        {/* Back link */}
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-secondary hover:text-ink-hero transition-colors mb-5 focus-brand rounded-sm"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden />
          Back to results
        </Link>

        {/* ============== Header ============== */}
        <header
          className={`rounded-[12px] border border-gray-200 border-l-4 ${trade.borderLeft} bg-white p-6 sm:p-8`}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <TradeIcon
                  size={22}
                  strokeWidth={2}
                  className={trade.text}
                  aria-hidden
                />
                <h1 className="text-[28px] sm:text-[32px] font-medium text-ink-hero tracking-[-0.3px] leading-tight">
                  {c.business_name}
                </h1>
              </div>
              {c.full_business_name &&
              c.full_business_name !== c.business_name ? (
                <p className="mt-1 text-[14px] text-ink-secondary">
                  {c.full_business_name}
                </p>
              ) : null}
              <p className="mt-2 text-[14px] text-ink-secondary">
                <span className="tabular-nums">
                  License #{c.license_number}
                </span>
                {c.primary_trade ? (
                  <>
                    {" · "}
                    {c.primary_trade}
                  </>
                ) : null}
                {c.city ? (
                  <>
                    {" · "}
                    {c.city}
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {telHref ? (
                <a
                  href={telHref}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-accent hover:bg-accent-hover text-white text-[14px] font-medium transition-colors focus-brand"
                >
                  <Phone size={14} strokeWidth={2.25} aria-hidden />
                  {formatPhone(c.phone)}
                </a>
              ) : null}
              <SaveContractorButton
                licenseNumber={c.license_number}
                variant="icon"
              />
            </div>
          </div>

          {/* Status / trust badges — covers Active, Workers' Comp, Bonded,
              Discipline (when applicable), Pending Suspension (when applicable). */}
          <div className="mt-5">
            <TrustBadgeRow contractor={c} />
          </div>

          <a
            href={publicRecordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-ink-hero hover:text-accent transition-colors focus-brand rounded-sm"
          >
            View public record
            <ExternalLink size={13} strokeWidth={2} aria-hidden />
          </a>

          {c.suspension_reason ? (
            <div className="mt-6 rounded-[10px] border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-700">
              <div className="font-medium">Suspension reason</div>
              <p className="mt-0.5 leading-relaxed">{c.suspension_reason}</p>
            </div>
          ) : null}

          {c.expires_soon_90d ? (
            <div className="mt-4 rounded-[10px] border border-warning-200 bg-warning-50 p-4 text-[13px] text-warning-700">
              License expires within 90 days.
              {c.expiration_date ? (
                <> Expires {formatDate(c.expiration_date)}.</>
              ) : null}
            </div>
          ) : null}
        </header>

        {/* ============== Ownership ============== */}
        <Section title="Ownership">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DataRow label="Entity type">
              {ownershipLabel(c.business_type)}
            </DataRow>
            <DataRow label="Owner / officers">
              <span className="font-normal text-ink-secondary italic">
                Owner information coming soon
              </span>
            </DataRow>
          </dl>
        </Section>

        {/* ============== License details ============== */}
        <Section title="License details">
          <div className="space-y-5">
            <div>
              <Label>Classifications</Label>
              <div className="mt-2">
                <ClassificationTags labels={c.classification_labels} />
              </div>
              {c.classification_codes && c.classification_codes.length > 0 ? (
                <p className="mt-2 text-[12px] text-ink-tertiary tabular-nums">
                  Codes: {c.classification_codes.join(", ")}
                </p>
              ) : null}
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              <DataRow label="Issue date">{formatDate(c.issue_date)}</DataRow>
              <DataRow label="Expiration date">
                {formatDate(c.expiration_date)}
              </DataRow>
              <DataRow label="Years in business">
                {formatYears(c.years_in_business)}
              </DataRow>
            </dl>
          </div>
        </Section>

        {/* ============== Contact ============== */}
        <Section title="Contact">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DataRow label="Phone">
              {telHref ? (
                <a
                  href={telHref}
                  className="text-ink-hero hover:text-accent transition-colors focus-brand rounded-sm"
                >
                  {formatPhone(c.phone)}
                </a>
              ) : (
                <NotProvided />
              )}
            </DataRow>
            <DataRow label="Address">
              {fullAddress || <NotProvided />}
            </DataRow>
            {c.county ? (
              <DataRow label="County">{c.county}</DataRow>
            ) : null}
          </dl>
        </Section>

        {/* ============== Disciplinary history (conditional) ============== */}
        {c.has_disciplinary_history ? (
          <Section title="Disciplinary history">
            <p className="text-[14px] text-ink-secondary leading-relaxed">
              This contractor has disciplinary records on file.{" "}
              <a
                href={publicRecordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-ink-hero hover:text-accent underline underline-offset-2 transition-colors focus-brand rounded-sm"
              >
                View full details on the CSLB public record
                <ExternalLink size={12} strokeWidth={2} aria-hidden />
              </a>
              .
            </p>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Local subcomponents ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-[12px] border border-line-subtle bg-white p-6 sm:p-8">
      <h2 className="text-[18px] font-medium text-ink-hero tracking-[-0.2px] mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.8px] font-medium text-ink-tertiary">
      {children}
    </div>
  );
}

function DataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.8px] font-medium text-ink-tertiary">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] text-ink-hero font-medium break-words">
        {children}
      </dd>
    </div>
  );
}

function NotProvided() {
  return <span className="text-ink-tertiary font-normal">Not provided</span>;
}
