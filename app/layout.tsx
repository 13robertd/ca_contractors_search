import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Fixd — Find trusted contractors near you",
    template: "%s · Fixd",
  },
  description:
    "Search licensed contractors by location and trade. Instantly see who's licensed, bonded, and ready to hire.",
  openGraph: {
    title: "Fixd — Find trusted contractors near you",
    description:
      "Search licensed contractors by location and trade. Instantly see who's licensed, bonded, and ready to hire.",
    url: "/",
    siteName: "Fixd",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0F14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-surface text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="page-container h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink"
          aria-label="Fixd home"
        >
          <span
            aria-hidden
            className="inline-block h-5 w-5 rounded-[5px] bg-ink"
          />
          <span>Fixd</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/search"
            className="px-3 py-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
          >
            Search
          </Link>
          <Link
            href="/saved"
            className="px-3 py-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
          >
            Saved
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="page-container py-6 text-xs text-ink-soft flex flex-wrap items-center justify-between gap-2">
        <span>© Fixd</span>
        <span>Licensing data sourced from public records. Verify before hiring.</span>
      </div>
    </footer>
  );
}
