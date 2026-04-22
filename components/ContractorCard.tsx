"use client";

import type { ComponentProps } from "react";
import ContractorCardBase from "@/components/cards/ContractorCardBase";

/**
 * Canonical contractor listing card used on the homepage and /search.
 * Defaults to `variant="detailed"` so every surface shares the same
 * trade border, icon, trust badges, classification tags, and meta row.
 *
 * Prefer importing from here rather than reaching for
 * `ContractorCardBase` directly in page-level layouts.
 */
export default function ContractorCard(
  props: ComponentProps<typeof ContractorCardBase>
) {
  const { variant, ...rest } = props;
  return (
    <ContractorCardBase {...rest} variant={variant ?? "detailed"} />
  );
}
