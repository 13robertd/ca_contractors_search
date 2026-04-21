/**
 * Shared UI primitives. Consumed by the homepage and /search to keep both
 * pages visually consistent. Each file documents its own spec + usage.
 */

export { default as SearchPill } from "./SearchPill";
export type { SearchPillSize } from "./SearchPill";
export {
  SearchSegment,
  SearchSegmentSelect,
  SearchSegmentDivider,
} from "./SearchSegment";
export { default as SectionHeading } from "./SectionHeading";
export { default as IconButton } from "./IconButton";
export { default as PillButton } from "./PillButton";
