import type { SupabaseClient } from "@supabase/supabase-js";

import { DETAILER_NAMES } from "@/lib/data";
import { fetchTeamPhotoUrlMap } from "@/lib/hub/staff-photo";

export type StaffMemberRow = {
  id: string;
  slug: string;
  display_name: string;
  role_label: string;
  bio: string;
  is_detailer: boolean;
  is_bookable: boolean;
  active: boolean;
  sort_order: number;
  profile_id: string | null;
  photo_url: string | null;
  profiles: { email: string; full_name: string; role: string } | null;
};

/** Active detailers customers/managers can assign (falls back to lib/data if DB empty). */
export async function fetchBookableDetailerNames(
  client: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await client
    .from("staff_members")
    .select("display_name")
    .eq("active", true)
    .eq("is_bookable", true)
    .eq("is_detailer", true)
    .order("sort_order");

  if (error) {
    console.error("[staff] bookable detailers:", error.message);
    return [...DETAILER_NAMES];
  }

  const names = (data ?? []).map((r) => r.display_name).filter(Boolean);
  return names.length > 0 ? names : [...DETAILER_NAMES];
}

export async function fetchStaffMembers(
  client: SupabaseClient,
): Promise<StaffMemberRow[]> {
  const { data, error } = await client
    .from("staff_members")
    .select(
      "id, slug, display_name, role_label, bio, is_detailer, is_bookable, active, sort_order, profile_id, profiles(email, full_name, role)",
    )
    .order("sort_order")
    .order("display_name");

  if (error) {
    console.error("[staff] list:", error.message);
    return [];
  }

  const photoMap = await fetchTeamPhotoUrlMap(client);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    role_label: row.role_label,
    bio: row.bio,
    is_detailer: row.is_detailer,
    is_bookable: row.is_bookable,
    active: row.active,
    sort_order: row.sort_order,
    profile_id: row.profile_id,
    photo_url: photoMap.get(row.slug) ?? null,
    profiles: Array.isArray(row.profiles)
      ? (row.profiles[0] ?? null)
      : row.profiles,
  })) as StaffMemberRow[];
}

export type DetailerCardInfo = {
  name: string;
  photo?: string;
};

export async function fetchBookableDetailersWithPhotos(
  client: SupabaseClient,
): Promise<DetailerCardInfo[]> {
  const { data, error } = await client
    .from("staff_members")
    .select("display_name, slug")
    .eq("active", true)
    .eq("is_bookable", true)
    .eq("is_detailer", true)
    .order("sort_order");

  const photoMap = await fetchTeamPhotoUrlMap(client);

  if (error || !data?.length) {
    return DETAILER_NAMES.map((name) => ({ name }));
  }

  return data.map((row) => ({
    name: row.display_name,
    photo: photoMap.get(row.slug),
  }));
}
