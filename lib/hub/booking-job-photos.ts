import type { SupabaseClient } from "@supabase/supabase-js";

import { BOOKING_PHOTOS_BUCKET, getBookingPhotoUrl } from "@/lib/supabase/storage";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024;

export type BookingJobPhotoRow = {
  id: string;
  booking_id: string;
  phase: "before" | "after";
  storage_path: string;
  created_at: string;
};

export type BookingJobPhotoView = {
  id: string;
  phase: "before" | "after";
  url: string;
  createdAt: string;
};

export function photoPublicUrl(storagePath: string): string {
  return getBookingPhotoUrl(storagePath);
}

export async function listBookingJobPhotos(
  client: SupabaseClient,
  bookingId: string,
): Promise<BookingJobPhotoView[]> {
  const { data, error } = await client
    .from("booking_job_photos")
    .select("id, phase, storage_path, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[booking photos] list:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    phase: row.phase as "before" | "after",
    url: photoPublicUrl(row.storage_path as string),
    createdAt: row.created_at as string,
  }));
}

export async function uploadBookingJobPhoto(
  bookingId: string,
  phase: "before" | "after",
  bytes: Uint8Array,
  contentType: string,
  uploadedBy: string,
): Promise<{ ok: true; photo: BookingJobPhotoView } | { ok: false; error: string }> {
  if (bytes.length > MAX_BYTES) {
    return { ok: false, error: "Photo must be 10 MB or smaller." };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      error: "Server is missing SUPABASE_SERVICE_ROLE_KEY for photo uploads.",
    };
  }

  const ext =
    contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const storagePath = `${bookingId}/${phase}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BOOKING_PHOTOS_BUCKET)
    .upload(storagePath, bytes, {
      upsert: false,
      contentType: contentType || `image/${ext === "jpg" ? "jpeg" : ext}`,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data: row, error: insertError } = await admin
    .from("booking_job_photos")
    .insert({
      booking_id: bookingId,
      phase,
      storage_path: storagePath,
      uploaded_by: uploadedBy,
    })
    .select("id, phase, storage_path, created_at")
    .single();

  if (insertError || !row) {
    await admin.storage.from(BOOKING_PHOTOS_BUCKET).remove([storagePath]);
    return { ok: false, error: insertError?.message ?? "Could not save photo record." };
  }

  return {
    ok: true,
    photo: {
      id: row.id as string,
      phase: row.phase as "before" | "after",
      url: photoPublicUrl(row.storage_path as string),
      createdAt: row.created_at as string,
    },
  };
}
