import { SectionHeading } from "@/components/ui";

interface Props {
  visibleCount: number;
  totalCount: number;
  isFiltered: boolean;
}

/**
 * /search page-level heading. Uses the shared <SectionHeading> primitive
 * (as="h1") so the type hierarchy stays 1:1 with the homepage section rows.
 */
export default function ResultsHeader({
  visibleCount,
  totalCount,
  isFiltered,
}: Props) {
  return (
    <SectionHeading
      as="h1"
      className="mb-5"
      title={`${visibleCount} ${
        visibleCount === 1 ? "contractor" : "contractors"
      } within map area`}
      subtitle={
        <>
          Showing licensed and verified contractors near you
          {isFiltered ? (
            <>
              {" · "}
              <span className="text-ink-tertiary tabular-nums">
                {totalCount - visibleCount} hidden outside view
              </span>
            </>
          ) : null}
        </>
      }
    />
  );
}
