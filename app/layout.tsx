import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

// Vercel auto-sets VERCEL_URL at build time (e.g. "my-app-abc123.vercel.app").
// We prefer NEXT_PUBLIC_SITE_URL if provided (for a stable custom domain),
// otherwise fall back to VERCEL_URL, otherwise localhost for dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TrustBuild — Find & Vet Licensed Contractors",
    template: "%s · TrustBuild",
  },
  description:
    "Search licensed contractors, verify bonds, workers' comp, and disciplinary history. Built for trust.",
  openGraph: {
    title: "TrustBuild — Find & Vet Licensed Contractors",
    description:
      "Search licensed contractors, verify bonds, workers' comp, and disciplinary history. Built for trust.",
    url: "/",
    siteName: "TrustBuild",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f6bff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-sm">
                TB
              </span>
              <span>TrustBuild</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/search"
                className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
              >
                Search
              </Link>
              <Link
                href="/saved"
                className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
              >
                Saved
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>© TrustBuild</span>
            <span>Licensing data sourced from public records. Verify before hiring.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
