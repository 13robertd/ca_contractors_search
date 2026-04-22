import HomePageClient from "@/components/home/HomePageClient";
import { getPublicContractorCount } from "@/lib/queries";

/** Fixed marketing / default search region (not derived from visitor IP). */
const HOME_REGION = "San Mateo";

export default async function HomePage() {
  const contractorCount = await getPublicContractorCount();

  return (
    <HomePageClient
      sectionCity={HOME_REGION}
      searchCity={HOME_REGION}
      contractorCount={contractorCount}
    />
  );
}
