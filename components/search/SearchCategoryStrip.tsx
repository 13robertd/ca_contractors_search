"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryStrip, {
  CATEGORIES,
  type CategoryId,
} from "@/components/home/CategoryStrip";

const VALID = new Set(CATEGORIES.map((c) => c.id));

/**
 * Trade filter chips for /search only — syncs ?trade= with the URL.
 */
export default function SearchCategoryStrip() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const active = useMemo((): CategoryId => {
    const t = searchParams.get("trade");
    if (t && VALID.has(t as CategoryId)) return t as CategoryId;
    return "all";
  }, [searchParams]);

  const onChange = useCallback(
    (id: CategoryId) => {
      const p = new URLSearchParams(searchParams.toString());
      if (id === "all") p.delete("trade");
      else p.set("trade", id);
      const qs = p.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="page-container border-t border-line-subtle py-3">
      <CategoryStrip active={active} onChange={onChange} />
    </div>
  );
}
