interface Props {
  visibleCount: number;
  totalCount: number;
  isFiltered: boolean;
}

/**
 * Mirrors the home page section-heading treatment:
 *   text-[22px] font-medium text-ink-hero tracking-[-0.3px]
 * so /search and / feel like the same product.
 */
export default function ResultsHeader({
  visibleCount,
  totalCount,
  isFiltered,
}: Props) {
  return (
    <header className="mb-5">
      <h1 className="text-[22px] font-medium tracking-[-0.3px] text-ink-hero m-0">
        {visibleCount} {visibleCount === 1 ? "contractor" : "contractors"}{" "}
        within map area
      </h1>
      <p className="mt-1 text-[15px] text-ink-secondary">
        Showing licensed and verified contractors near you
        {isFiltered ? (
          <>
            {" · "}
            <span className="text-ink-tertiary tabular-nums">
              {totalCount - visibleCount} hidden outside view
            </span>
          </>
        ) : null}
      </p>
    </header>
  );
}
