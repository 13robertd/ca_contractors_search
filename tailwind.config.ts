import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm, confident red. Sits between Yelp red and Airbnb rausch.
        brand: {
          50:  "#fcedef",
          100: "#fad4d9",
          200: "#f4a8b2",
          300: "#ec7787",
          400: "#e24d62",
          500: "#d7263d",
          600: "#b81e33",
          700: "#971728",
          800: "#73121f",
          900: "#510c16",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          muted:   "#5c5c5c",
          subtle:  "#8a8a8a",
        },
        surface: {
          DEFAULT: "#ffffff",
          alt:     "#fafaf7",
          sunken:  "#f4f1ec",
        },
        hairline: "#e6e1da",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm:  "6px",
        md:  "10px",
        lg:  "14px",
        xl:  "18px",
      },
      boxShadow: {
        card:       "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        cardHover:  "0 4px 12px rgba(16,24,40,0.08)",
        focus:      "0 0 0 3px rgba(215,38,61,0.18)",
      },
      letterSpacing: {
        tightish: "-0.01em",
      },
    },
  },
  plugins: [],
};

export default config;
