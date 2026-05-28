import { getSupabaseUrl } from "@/lib/supabase/env";

/** Public bucket for website photos (gallery, team headshots, etc.). */
export const SITE_MEDIA_BUCKET = "site-media";

/** Public bucket for detailer before/after job photos. */
export const BOOKING_PHOTOS_BUCKET = "booking-photos";

/**
 * Public URL for a file in `site-media`.
 * @param storagePath Path inside the bucket, e.g. `gallery/detail-01.webp`
 */
export function getPublicMediaUrl(storagePath: string, bucket = SITE_MEDIA_BUCKET): string {
  const base = getSupabaseUrl();
  const path = storagePath.replace(/^\//, "");
  if (!base) return path;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function getBookingPhotoUrl(storagePath: string): string {
  return getPublicMediaUrl(storagePath, BOOKING_PHOTOS_BUCKET);
}
