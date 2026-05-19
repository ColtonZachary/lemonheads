import { getSupabaseUrl } from "@/lib/supabase/env";

/** Public bucket for website photos (gallery, team headshots, etc.). */
export const SITE_MEDIA_BUCKET = "site-media";

/**
 * Public URL for a file in `site-media`.
 * @param storagePath Path inside the bucket, e.g. `gallery/detail-01.webp`
 */
export function getPublicMediaUrl(storagePath: string): string {
  const base = getSupabaseUrl();
  const path = storagePath.replace(/^\//, "");
  if (!base) return path;
  return `${base}/storage/v1/object/public/${SITE_MEDIA_BUCKET}/${path}`;
}
