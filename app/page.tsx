import { headers } from "next/headers";
import HomePageClient from "@/components/home/HomePageClient";

/**
 * Reading request headers opts this route into dynamic rendering, which
 * is what we want — the "Popular near you" row is personalized per
 * request. Keep this explicit so a future edit doesn't accidentally
 * restore static caching.
 */
export const dynamic = "force-dynamic";

/**
 * Derive a display city from Vercel geolocation headers. We only trust
 * the city when the request is US-CA — our dataset is California-only,
 * so "Plumbers near Portland" would be a broken experience.
 *
 * Header reference: https://vercel.com/docs/edge-network/headers
 *   - x-vercel-ip-country         (e.g. "US")
 *   - x-vercel-ip-country-region  (e.g. "CA")
 *   - x-vercel-ip-city            (URL-encoded)
 */
function getDisplayCity(h: Headers): string {
  const country = h.get("x-vercel-ip-country");
  const region = h.get("x-vercel-ip-country-region");
  const rawCity = h.get("x-vercel-ip-city");

  if (country !== "US" || region !== "CA" || !rawCity) {
    return "San Francisco";
  }

  try {
    return decodeURIComponent(rawCity);
  } catch {
    return "San Francisco";
  }
}

export default async function HomePage() {
  const h = await headers();
  const city = getDisplayCity(h);

  if (process.env.NODE_ENV !== "production") {
    console.log("[Fixd] geo city:", city, {
      country: h.get("x-vercel-ip-country"),
      region: h.get("x-vercel-ip-country-region"),
      rawCity: h.get("x-vercel-ip-city"),
    });
  }

  return <HomePageClient popularCity={city} />;
}
