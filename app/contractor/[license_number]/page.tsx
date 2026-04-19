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

  const issues: { label: string; tone: "good" | "warn" | "bad" }[] = [];
  if (c.is_active) issues.push({ label: "License active", tone: "good" });
  else issues.push({ label: "License not active", tone: "bad" });
  if (c.has_workers_comp) issues.push({ label: "Workers' comp on file", tone: "good" });
  else issues.push({ label: "No workers' comp on file", tone: "warn" });
  if (c.has_contractor_bond) issues.push({ label: "Contractor bond on file", tone: "good" });
  else issues.push({ label: "No contractor bond on file", tone: "warn" });
  if (c.has_pending_suspension)
    issues.push({ label: "Pending suspension", tone: "bad" });
  if (c.has_disciplinary_history)
    issues.push({ label: "Has disciplinary history", tone: "warn" });
  if (c.expires_soon_90d)
    issues.push({ label: "License expires within 90 days", tone: "warn" });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-4">
        <Link href="/search" className="text-sm text-ink-muted hover:text-brand-600">
          ← Back to results
        </Link>
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tightish text-ink">
              {c.business_name}
            </h1>
            {c.full_business_name && c.full_business_name !== c.business_name ? (
              <p className="text-sm text-ink-subtle mt-1">{c.full_business_name}</p>
            ) : null}
            <p className="text-sm text-ink mt-2">
              {c.primary_trade || "General contractor"}
              {c.city ? <> · <span className="text-ink-muted">{c.city}</span></> : null}
              {c.county ? <> · <span className="text-ink-muted">{c.county} County</span></> : null}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge contractor={c} />
              <span className="chip">License #{c.license_number}</span>
              {c.business_type ? <span className="chip">{c.business_type}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {telHref ? (
              <a href={telHref} className="btn-primary">
                Call {formatPhone(c.phone)}
              </a>
            ) : null}
            <SaveContractorButton licenseNumber={c.license_number} />
          </div>
        </div>

        {c.suspension_reason ? (
          <div className="mt-5 rounded-md border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            <div className="font-semibold">Suspension reason</div>
            <p className="mt-0.5">{c.suspension_reason}</p>
          </div>
        ) : null}
      </div>

      {/* Trust summary */}
      <div className="card p-6 mt-6">
        <h2 className="text-base font-semibold text-ink">Trust summary</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          Key compliance and insurance signals from public records.
        </p>

        <div className="mt-4">
          <TrustBadgeRow contractor={c} />
        </div>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {issues.map((it) => {
            const cls =
              it.tone === "good"
                ? "text-emerald-700"
                : it.tone === "warn"
                ? "text-amber-700"
                : "text-brand-700";
            const icon = it.tone === "good" ? "✓" : it.tone === "warn" ? "!" : "✕";
            return (
              <li key={it.label} className="flex items-start gap-2 text-sm">
                <span className={`font-bold ${cls}`}>{icon}</span>
                <span className="text-ink">{it.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Details grid */}
      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-base font-semibold text-ink">Contact</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Phone">
              {c.phone ? (
                <a href={`tel:${c.phone}`} className="hover:text-brand-600">
                  {formatPhone(c.phone)}
                </a>
              ) : (
                "—"
              )}
            </Row>
            <Row label="Address">{c.address || "—"}</Row>
            <Row label="City / State / Zip">{formatCityStateZip(c)}</Row>
            <Row label="County">{c.county || "—"}</Row>
          </dl>
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-ink">License</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="License #">{c.license_number}</Row>
            <Row label="Status">{c.primary_status || "—"}</Row>
            <Row label="Issued">{formatDate(c.issue_date)}</Row>
            <Row label="Expires">{formatDate(c.expiration_date)}</Row>
            <Row label="Years in business">{formatYears(c.years_in_business)}</Row>
            <Row label="Last updated">{formatDate(c.last_update)}</Row>
          </dl>
        </section>
      </div>

      {/* Classifications */}
      <section className="card p-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            Classifications
          </h2>
          <span className="text-xs text-ink-subtle">
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
          <p className="mt-3 text-xs text-ink-subtle">
            Codes: {c.classification_codes.join(", ")}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3">
      <dt className="text-ink-muted w-32">{label}</dt>
      <dd className="text-ink font-medium break-words">{children}</dd>
    </div>
  );
}
