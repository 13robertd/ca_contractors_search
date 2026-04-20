interface Props {
  visibleCount: number;
  totalCount: number;
  isFiltered: boolean;
}

export default function ResultsHeader({
  visibleCount,
  totalCount,
  isFiltered,
}: Props) {
  return (
    <header className="mb-4">
      <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-ink leading-tight">
        {visibleCount} {visibleCount === 1 ? "contractor" : "contractors"}{" "}
        within map area
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Showing licensed and verified contractors near you
        {isFiltered ? (
          <>
            {" · "}
            <span className="text-ink-soft tabular-nums">
              {totalCount - visibleCount} hidden outside view
            </span>
          </>
        ) : null}
      </p>
    </header>
  );
}
