import { notFound } from "next/navigation";
import Link from "next/link";
import { getContractorByLicense } from "@/lib/queries";
import {
  formatCityStateZip,
  formatDate,
  formatPhone,
  formatYears,
} from "@/lib/formatters";
import StatusBadge from "@/components/StatusBadge";
import TrustBadgeRow from "@/components/TrustBadgeRow";
import ClassificationTags from "@/components/ClassificationTags";
import SaveContractorButton from "@/components/SaveContractorButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ license_number: string }>;
}

type IssueTone = "good" | "warn" | "bad";

export default async function ContractorDetailPage({ params }: PageProps) {
  const { license_number } = await params;
  const license = decodeURIComponent(license_number);

  const contractor = await getContractorByLicense(license).catch((err) => {
    console.error(err);
    return null;
  });

  if (!contractor) notFound();
  const c = contractor;
  const telHref = c.phone ? `tel:${c.phone.replace(/\D/g, "")}` : undefined;

  const issues: { label: string; tone: IssueTone }[] = [];
  if (c.is_active) issues.push({ label: "License active", tone: "good" });
  else issues.push({ label: "License not active", tone: "bad" });
  if (c.has_workers_comp) issues.push({ label: "Workers' comp on file", tone: "good" });
  else issues.push({ label: "No workers' comp on file", tone: "warn" });
  if (c.has_contractor_bond) issues.push({ label: "Contractor bond on file", tone: "good" });
  else issues.push({ label: "No contractor bond on file", tone: "warn" });
  if (c.has_pending_suspension) issues.push({ label: "Pending suspension", tone: "bad" });
  if (c.has_disciplinary_history) issues.push({ label: "Has disciplinary history", tone: "warn" });
  if (c.expires_soon_90d) issues.push({ label: "License expires within 90 days", tone: "warn" });

  return (
    <div className="bg-surface-subtle min-h-[calc(100vh-3.5rem)] border-t border-line">
      <div className="page-container py-6 sm:py-10 max-w-4xl">
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M12.7 4.3a1 1 0 0 1 0 1.4L8.42 10l4.3 4.3a1 1 0 1 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.42 0Z" clipRule="evenodd" />
          </svg>
          Back to results
        </Link>

        {/* Header */}
        <div className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StatusBadge contractor={c} />
                <span className="chip">License #{c.license_number}</span>
                {c.business_type ? <span className="chip">{c.business_type}</span> : null}
              </div>

              <h1 className="text-h1 text-ink">{c.business_name}</h1>
              {c.full_business_name && c.full_business_name !== c.business_name ? (
                <p className="text-sm text-ink-soft mt-1">{c.full_business_name}</p>
              ) : null}
              <p className="mt-3 text-ink-muted text-sm">
                {c.primary_trade || "General contractor"}
                {c.city ? <> · <span>{c.city}</span></> : null}
                {c.county ? <> · <span>{c.county} County</span></> : null}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {telHref ? (
                <a href={telHref} className="btn-primary">
                  <PhoneIcon />
                  {formatPhone(c.phone)}
                </a>
              ) : null}
              <SaveContractorButton licenseNumber={c.license_number} />
            </div>
          </div>

          {c.suspension_reason ? (
            <div className="mt-6 rounded-md border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
              <div className="font-semibold">Suspension reason</div>
              <p className="mt-0.5 leading-relaxed">{c.suspension_reason}</p>
            </div>
          ) : null}
        </div>

        {/* Trust summary */}
        <div className="card p-6 sm:p-8 mt-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-h2 text-ink">Trust summary</h2>
              <p className="text-sm text-ink-muted mt-0.5">
                Key compliance and insurance signals from public records.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <TrustBadgeRow contractor={c} />
          </div>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {issues.map((it) => (
              <IssueRow key={it.label} label={it.label} tone={it.tone} />
            ))}
          </ul>
        </div>

        {/* Details grid */}
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <section className="card p-6">
            <h2 className="text-h3 text-ink">Contact</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Phone">
                {c.phone ? (
                  <a href={`tel:${c.phone}`} className="hover:text-ink-muted">
                    {formatPhone(c.phone)}
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Address">{c.address || "—"}</Row>
              <Row label="City/State/Zip">{formatCityStateZip(c)}</Row>
              <Row label="County">{c.county || "—"}</Row>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="text-h3 text-ink">License</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="License #" mono>{c.license_number}</Row>
              <Row label="Status">{c.primary_status || "—"}</Row>
              <Row label="Issued">{formatDate(c.issue_date)}</Row>
              <Row label="Expires">{formatDate(c.expiration_date)}</Row>
              <Row label="Years in business">{formatYears(c.years_in_business)}</Row>
              <Row label="Last updated">{formatDate(c.last_update)}</Row>
            </dl>
          </section>
        </div>

        {/* Classifications */}
        <section className="card p-6 sm:p-8 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-h3 text-ink">Classifications</h2>
            <span className="text-xs text-ink-soft">
              {c.classification_count} total
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-0.5">
            Primary trade:{" "}
            <span className="text-ink font-medium">
              {c.primary_trade || "—"}
            </span>
          </p>
          <div className="mt-4">
            <ClassificationTags labels={c.classification_labels} />
          </div>
          {c.classification_codes && c.classification_codes.length > 0 ? (
            <p className="mt-3 text-xs text-ink-soft tabular-nums">
              Codes: {c.classification_codes.join(", ")}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3">
      <dt className="text-ink-soft text-[13px]">{label}</dt>
      <dd className={`text-ink font-medium break-words ${mono ? "tabular-nums" : ""}`}>
        {children}
      </dd>
    </div>
  );
}

function IssueRow({ label, tone }: { label: string; tone: IssueTone }) {
  const cls =
    tone === "good"
      ? "text-positive-700"
      : tone === "warn"
      ? "text-warning-700"
      : "text-danger-700";
  const icon = tone === "good" ? "✓" : tone === "warn" ? "!" : "✕";
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-sm text-xs font-bold ${cls} bg-white border border-line shrink-0`}>
        {icon}
      </span>
      <span className="text-ink pt-0.5">{label}</span>
    </li>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M2 4.5A2.5 2.5 0 0 1 4.5 2h1.13a2 2 0 0 1 1.94 1.52l.58 2.31a2 2 0 0 1-.55 1.92L6.45 8.9a11 11 0 0 0 4.65 4.65l1.15-1.15a2 2 0 0 1 1.92-.55l2.31.58A2 2 0 0 1 18 14.37v1.13a2.5 2.5 0 0 1-2.5 2.5C8.04 18 2 11.96 2 4.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
