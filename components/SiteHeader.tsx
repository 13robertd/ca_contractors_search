"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, User } from "lucide-react";
import HomeSearchBar from "@/components/home/HomeSearchBar";

/**
 * Global nav. Wordmark + Saved + account menu are always visible.
 *
 * On "/", once the user scrolls past the hero search, a compact
 * "Anywhere · Any trade" pill fades into the center of the nav.
 * Clicking that pill drops down an expanded HomeSearchBar.
 *
 * On /search, /saved, and the contractor detail page the pill never
 * renders — those routes have their own search UI.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef<HTMLDivElement | null>(null);

  // Track scroll threshold only on the homepage; clean up otherwise.
  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    function onScroll() {
      setScrolled(window.scrollY > 380);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Dismiss the expanded search on outside click / escape.
  useEffect(() => {
    if (!expanded) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    function onClick(e: MouseEvent) {
      if (
        expandedRef.current &&
        !expandedRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [expanded]);

  const showPill = isHome && scrolled && !expanded;

  return (
    <header className="sticky top-0 z-40 border-b border-line-subtle bg-white">
      <div className="page-container h-16 flex items-center justify-between gap-4">
        {/* Wordmark — crimson, 500 weight */}
        <Link
          href="/"
          aria-label="Fixd home"
          className="font-sans text-[22px] font-medium tracking-tight text-wordmark hover:text-wordmark-hover transition-colors focus-brand rounded-sm"
        >
          Fixd
        </Link>

        {/* Center slot — pill appears only on homepage + scrolled */}
        <div className="flex-1 flex justify-center">
          {showPill ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-3 h-11 pl-5 pr-1.5 rounded-full border border-line-subtle bg-white shadow-search-expanded hover:shadow-[0_6px_16px_rgba(0,0,0,0.16)] transition-shadow focus-brand"
              aria-label="Expand search"
            >
              <span className="text-[14px] font-medium text-ink-hero">
                Anywhere
              </span>
              <span className="h-4 w-px bg-line-subtle" aria-hidden />
              <span className="text-[14px] text-ink-secondary">
                Any trade
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                <Search size={14} strokeWidth={2.5} />
              </span>
            </button>
          ) : null}
        </div>

        {/* Right cluster */}
        <nav className="flex items-center gap-2">
          <Link
            href="/saved"
            className="hidden sm:inline-flex h-9 items-center px-3 rounded-full text-[14px] font-medium text-ink-hero hover:bg-surface-subtle transition-colors focus-brand"
          >
            Saved
          </Link>

          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line-subtle bg-white text-ink-hero hover:shadow-card transition-shadow focus-brand"
          >
            <Menu size={14} strokeWidth={2.25} className="mr-0.5" aria-hidden />
            <User size={14} strokeWidth={2.25} aria-hidden />
          </button>
        </nav>
      </div>

      {/* Expanded search dropdown (pill → full bar) */}
      {expanded ? (
        <div
          ref={expandedRef}
          className="border-t border-line-subtle bg-white"
        >
          <div className="page-container py-4 max-w-3xl">
            <HomeSearchBar size="md" />
          </div>
        </div>
      ) : null}
    </header>
  );
}
