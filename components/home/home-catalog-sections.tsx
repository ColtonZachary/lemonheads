import { AddOns } from "@/components/home/addons";
import { Packages } from "@/components/home/packages";
import { getCachedPublicCatalog } from "@/lib/catalog/cached-public-catalog";

export async function HomeCatalogSections() {
  const catalog = await getCachedPublicCatalog({ includeLocations: false });

  return (
    <>
      <Packages packages={catalog.packages} />
      <AddOns addons={catalog.addons} />
    </>
  );
}
