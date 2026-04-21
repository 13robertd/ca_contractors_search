import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Shared heading treatment used by the homepage section rows and the
 * /search results header. Handles three responsibilities:
 *
 *   1. Canonical title type: 22px / 500 / ink-hero / tracking-[-0.3px].
 *   2. Canonical subtitle type: 15px / ink-secondary.
 *   3. Optional "see all" affordance — a 32px #F1F1F1 circle arrow button
 *      rendered as a Link when `seeAllHref` is provided.
 *
 * Use `as="h1"` for page-level headings (e.g. /search results count).
 * Use the default `as="h2"` for homepage section rows.
 */

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  seeAllHref?: string;
  seeAllLabel?: string;
  as?: "h1" | "h2";
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel,
  as = "h2",
  className = "",
}: Props) {
  const Tag = as;

  return (
    <header className={className}>
      <div className="flex items-center gap-[14px]">
        <Tag className="text-[22px] font-medium text-ink-hero tracking-[-0.3px] m-0">
          {title}
        </Tag>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            aria-label={seeAllLabel ?? `See all: ${title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F1F1] hover:bg-[#E5E5E5] text-ink-hero transition-colors focus-brand"
          >
            <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
          </Link>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-1 text-[15px] text-ink-secondary">{subtitle}</p>
      ) : null}
    </header>
  );
}
