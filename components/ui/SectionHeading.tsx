import Link from "next/link";

/**
 * Section title + optional subtitle + optional “See all →” text link.
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <Tag className="m-0 min-w-0 flex-1 text-[22px] font-medium tracking-[-0.3px] text-ink-hero">
          {title}
        </Tag>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="shrink-0 text-[14px] font-medium text-accent transition-colors hover:text-accent-hover hover:underline focus-brand rounded-sm"
          >
            {seeAllLabel ?? "See all →"}
          </Link>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-1 text-[15px] text-ink-secondary">{subtitle}</p>
      ) : null}
    </header>
  );
}
