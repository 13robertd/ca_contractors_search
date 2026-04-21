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
import type { TradeSlug } from "@/lib/mockContractors";

export type CategoryId = "all" | TradeSlug;

interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { id: "all",         label: "All",          icon: Grid3x3     },
  { id: "plumbing",    label: "Plumbers",     icon: Wrench      },
  { id: "electrical",  label: "Electricians", icon: Plug        },
  { id: "roofing",     label: "Roofers",      icon: Home        },
  { id: "hvac",        label: "HVAC",         icon: Snowflake   },
  { id: "painting",    label: "Painters",     icon: PaintBucket },
  { id: "general",     label: "General",      icon: Hammer      },
  { id: "landscaping", label: "Landscapers",  icon: Trees       },
];

interface Props {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

export default function CategoryStrip({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Contractor categories"
      className="flex gap-8 overflow-x-auto no-scrollbar"
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === active;
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat.id)}
            className={`group shrink-0 flex flex-col items-center gap-1.5 pt-3 pb-3 border-b-2 transition-opacity focus-brand ${
              isActive
                ? "border-ink-hero opacity-100"
                : "border-transparent opacity-65 hover:opacity-100"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={1.75}
              className="text-ink-hero"
              aria-hidden
            />
            <span className="text-[12px] font-medium text-ink-hero whitespace-nowrap">
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
