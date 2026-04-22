import { headers } from "next/headers";
import HomePageClient from "@/components/home/HomePageClient";
import { getPublicContractorCount } from "@/lib/queries";

function sectionCityFromHeaders(h: Headers): string {
  const raw = h.get("x-vercel-ip-city")?.trim();
  if (raw && raw.length > 0) {
    return raw.split(",")[0].trim();
  }
  return "SF Bay Area";
}

export default async function HomePage() {
  const h = await headers();
  const sectionCity = sectionCityFromHeaders(h);
  const contractorCount = await getPublicContractorCount();

  return (
    <HomePageClient
      sectionCity={sectionCity}
      searchCity={sectionCity}
      contractorCount={contractorCount}
    />
  );
}
