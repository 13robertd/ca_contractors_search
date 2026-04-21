import HomePageClient from "@/components/home/HomePageClient";

/**
 * The homepage currently renders from mock data that is all hardcoded
 * to San Mateo (see lib/mockContractors.ts). To keep the "Popular near
 * you" row consistent with what a click will actually return, we pin
 * the popular city to San Mateo too. Once real statewide data lands
 * in Supabase, swap this for a geolocation-aware derivation (Vercel
 * provides x-vercel-ip-city / -country / -country-region at request
 * time — see the git history on this file for the previous impl).
 */
const POPULAR_CITY = "San Mateo";

export default function HomePage() {
  return <HomePageClient popularCity={POPULAR_CITY} />;
}
