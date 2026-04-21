import type { Config } from "tailwindcss";

/**
 * Fixd design tokens.
 *
 * This is the single source of truth for the brand palette + scale.
 * Edit colors here and the entire app follows.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces & text
        ink: {
          DEFAULT: "#0B0F14", // near-black, primary text on /search, /saved, /detail
          hero:    "#222222", // homepage spec — #222 primary
          muted:   "#4B5563", // secondary text
          secondary: "#6A6A6A", // homepage spec — #6A6A6A
          soft:    "#6B7280", // tertiary text / helper
          tertiary: "#B0B0B0", // homepage spec — #B0B0B0
        },
        surface: {
          DEFAULT: "#FFFFFF", // primary background
          subtle: "#F7F7F8",  // secondary background / section separators
          sunk: "#F1F2F4",    // input background on dark cards
        },
        line: {
          DEFAULT: "#E4E4E7", // default border
          strong: "#D4D4D8",  // heavier divider
          subtle: "#E5E5E5",  // homepage spec border
        },
        // Homepage brand — crimson. Reserved for the wordmark, primary CTA,
        // the search button, active category underline, and filled-heart save.
        brand: {
          DEFAULT: "#B91C1C", // primary crimson
          hover:   "#9F1818",
          50:  "#FBECEC",     // lightest tint, badge backgrounds
          100: "#FECACA",     // mid tint, hover surfaces
          900: "#5A0E0E",     // darkest, text on brand-50 fills
        },
        // License-card credential tile palette
        credential: {
          DEFAULT: "#1E1B1A", // near-black with hint of warmth
        },
        // Legacy Fixd neutral brand — kept so /search + /saved keep their Linear/Stripe feel
        fixd: {
          DEFAULT: "#0B0F14",
          hover: "#1F2937",
          accent: "#0F9D58",
        },
        // Semantic (used inside badges/pills, not on large surfaces)
        positive: {
          50:  "#ECFDF5",
          200: "#A7F3D0",
          500: "#10B981",
          700: "#047857",
        },
        warning: {
          50:  "#FFFBEB",
          200: "#FDE68A",
          500: "#F59E0B",
          700: "#B45309",
        },
        danger: {
          50:  "#FEF2F2",
          200: "#FECACA",
          500: "#EF4444",
          700: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        // Tight, product-grade scale
        "display": ["3rem",    { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "700" }],
        "h1":      ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "700" }],
        "h2":      ["1.5rem",  { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        "h3":      ["1.125rem", { lineHeight: "1.35", letterSpacing: "-0.01em",  fontWeight: "600" }],
      },
      borderRadius: {
        "xs":  "4px",
        "sm":  "6px",
        "DEFAULT": "8px",
        "md":  "10px",
        "lg":  "12px",
        "xl":  "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card:      "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
        pop:       "0 8px 24px rgba(15, 23, 42, 0.12)",
        // Homepage search bar expanded state — spec: 0 6px 16px rgba(0,0,0,0.12)
        "search-expanded": "0 6px 16px rgba(0, 0, 0, 0.12)",
      },
      maxWidth: {
        page: "1200px",
        prose: "68ch",
      },
      spacing: {
        "section": "4rem",
      },
    },
  },
  plugins: [],
};

export default config;
