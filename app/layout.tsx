import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Vercel auto-sets VERCEL_URL at build time (e.g. "my-app-abc123.vercel.app").
// We prefer NEXT_PUBLIC_SITE_URL if provided (for a stable custom domain),
// otherwise fall back to VERCEL_URL, otherwise localhost for dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Plumbd — Find & Vet Licensed Contractors",
    template: "%s · Plumbd",
  },
  description:
    "Search licensed contractors, verify bonds, workers' comp, and disciplinary history. Built for trust.",
  openGraph: {
    title: "Plumbd — Find & Vet Licensed Contractors",
    description:
      "Search licensed contractors, verify bonds, workers' comp, and disciplinary history. Built for trust.",
    url: "/",
    siteName: "Plumbd",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d7263d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-surface text-ink">
        <header className="border-b border-hairline bg-surface sticky top-0 z-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-baseline gap-0.5 text-ink"
              aria-label="Plumbd home"
            >
              <span className="text-lg font-semibold tracking-tightish">Plumbd</span>
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-brand-500 translate-y-[-1px]"
              />
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/search"
                className="rounded-md px-3 py-2 text-ink-muted hover:text-ink hover:bg-surface-alt"
              >
                Search
              </Link>
              <Link
                href="/saved"
                className="rounded-md px-3 py-2 text-ink-muted hover:text-ink hover:bg-surface-alt"
              >
                Saved
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-hairline bg-surface">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-xs text-ink-subtle flex flex-wrap items-center justify-between gap-2">
            <span>© Plumbd</span>
            <span>Licensing data sourced from public records. Verify before hiring.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
