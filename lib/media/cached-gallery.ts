import { unstable_cache } from "next/cache";

import { getGalleryItems, type GalleryItem } from "@/lib/media";

export const GALLERY_CACHE_TAG = "gallery-items";

export function getCachedGalleryItems(): Promise<GalleryItem[]> {
  return unstable_cache(
    () => getGalleryItems({ usePublicReadClient: true }),
    ["gallery-items"],
    { revalidate: 300, tags: [GALLERY_CACHE_TAG] },
  )();
}
