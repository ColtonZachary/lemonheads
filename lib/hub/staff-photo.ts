import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicMediaUrl, SITE_MEDIA_BUCKET } from "@/lib/supabase/storage";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

function extensionForFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  if (file.type === "image/gif") return "gif";
  return "webp";
}

export async function uploadStaffPhoto(
  slug: string,
  displayName: string,
  file: File,
): Promise<{ ok: true; photoUrl: string } | { ok: false; error: string }> {
  if (!file.size) {
    return { ok: false, error: "No photo file selected." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Photo must be 10 MB or smaller." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Use a JPEG, PNG, or WebP image.",
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      error: "Server is missing SUPABASE_SERVICE_ROLE_KEY for photo uploads.",
    };
  }

  const ext = extensionForFile(file);
  const storagePath = `team/${slug}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(SITE_MEDIA_BUCKET)
    .upload(storagePath, bytes, {
      upsert: true,
      contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  await admin
    .from("site_images")
    .delete()
    .eq("category", "team")
    .eq("member_slug", slug);

  const { error: dbError } = await admin.from("site_images").insert({
    category: "team",
    storage_path: storagePath,
    alt_text: displayName,
    member_slug: slug,
    sort_order: 0,
    published: true,
  });

  if (dbError) {
    return { ok: false, error: dbError.message };
  }

  return { ok: true, photoUrl: getPublicMediaUrl(storagePath) };
}

export async function fetchTeamPhotoUrlMap(
  client?: SupabaseClient | null,
): Promise<Map<string, string>> {
  const db = client ?? getSupabaseAdmin();
  if (!db) return new Map();

  const { data, error } = await db
    .from("site_images")
    .select("storage_path, member_slug")
    .eq("category", "team")
    .eq("published", true);

  if (error) {
    console.error("[staff-photo] fetch:", error.message);
    return new Map();
  }

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.member_slug) {
      map.set(row.member_slug, getPublicMediaUrl(row.storage_path));
    }
  }
  return map;
}

/** Removes team headshot metadata and storage files for a staff slug. */
export async function deleteStaffPhoto(slug: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const { data: rows } = await admin
    .from("site_images")
    .select("storage_path")
    .eq("category", "team")
    .eq("member_slug", slug);

  const paths = (rows ?? []).map((r) => r.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await admin.storage.from(SITE_MEDIA_BUCKET).remove(paths);
  }

  await admin.from("site_images").delete().eq("category", "team").eq("member_slug", slug);
}
