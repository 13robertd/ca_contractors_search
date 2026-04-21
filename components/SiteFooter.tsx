import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line-subtle bg-surface-subtle mt-16">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <FooterColumn title="About">
            <FooterLink href="/">Mission</FooterLink>
            <span className="text-[13px] text-ink-secondary">
              Licensing data sourced from the California CSLB public records.
            </span>
          </FooterColumn>

          <FooterColumn title="Support">
            <FooterLink href="/">How we verify contractors</FooterLink>
            <FooterLink href="/">FAQ</FooterLink>
          </FooterColumn>

          <FooterColumn title="For contractors">
            <FooterLink href="/">Claim your listing</FooterLink>
            <FooterLink href="/">Trust policy</FooterLink>
          </FooterColumn>
        </div>
      </div>

      <div className="border-t border-line-subtle bg-white">
        <div className="page-container py-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-secondary">
          <span>© Fixd</span>
          <span>
            Licensing data sourced from California CSLB public records.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-hero">
        {title}
      </h3>
      <ul className="mt-3 flex flex-col gap-2">
        {Array.isArray(children)
          ? children.map((c, i) => <li key={i}>{c}</li>)
          : <li>{children}</li>}
      </ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[13px] text-ink-secondary hover:text-ink-hero transition-colors"
    >
      {children}
    </Link>
  );
}
