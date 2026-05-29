import { unstable_cache } from "next/cache";

import {
  fetchPublicCatalog,
  type PublicCatalog,
} from "@/lib/catalog/public-catalog";
import { createPublicReadClient } from "@/lib/supabase/public-read";

export const PUBLIC_CATALOG_CACHE_TAG = "public-catalog";

type CatalogFetchOptions = {
  includeLocations?: boolean;
};

async function loadPublicCatalog(
  options: CatalogFetchOptions = {},
): Promise<PublicCatalog> {
  const client = createPublicReadClient();
  return fetchPublicCatalog(client, options);
}

/** Cached catalog for marketing pages (home, book). Invalidated from hub catalog actions. */
export function getCachedPublicCatalog(
  options: CatalogFetchOptions = {},
): Promise<PublicCatalog> {
  const includeLocations = options.includeLocations ?? true;
  return unstable_cache(
    () => loadPublicCatalog({ includeLocations }),
    ["public-catalog", includeLocations ? "with-locations" : "packages-only"],
    { revalidate: 300, tags: [PUBLIC_CATALOG_CACHE_TAG] },
  )();
}
