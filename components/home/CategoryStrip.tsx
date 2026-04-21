"use client";

import {
  Grid3x3,
  Wrench,
  Plug,
  Home,
  Snowflake,
  PaintBucket,
  Hammer,
  Trees,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TradeSlug } from "@/lib/trades";
import { PillButton } from "@/components/ui";

export type CategoryId = "all" | TradeSlug;

interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { id: "all",        label: "All",          icon: Grid3x3     },
  { id: "plumbing",   label: "Plumbers",     icon: Wrench      },
  { id: "electrical", label: "Electricians", icon: Plug        },
  { id: "roofing",    label: "Roofers",      icon: Home        },
  { id: "hvac",       label: "HVAC",         icon: Snowflake   },
  { id: "painting",   label: "Painters",     icon: PaintBucket },
  { id: "general",    label: "General",      icon: Hammer      },
  { id: "landscape",  label: "Landscapers",  icon: Trees       },
];

interface Props {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

/**
 * Horizontally scrollable category filter. Uses the shared <PillButton>
 * primitive so each category reads identically to the Saved link, Filters
 * chip, and the mobile List/Map toggle — one common chip language across
 * the whole product.
 *
 * `role="tablist"` + `aria-selected` are preserved so assistive tech still
 * treats the row as a tab group rather than a menu of buttons.
 */
export default function CategoryStrip({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Contractor categories"
      className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === active;
        const Icon = cat.icon;
        return (
          <PillButton
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            variant={isActive ? "active" : "neutral"}
            onClick={() => onChange(cat.id)}
            className="shrink-0"
          >
            <Icon size={16} strokeWidth={2} aria-hidden />
            <span className="whitespace-nowrap">{cat.label}</span>
          </PillButton>
        );
      })}
    </div>
  );
}
