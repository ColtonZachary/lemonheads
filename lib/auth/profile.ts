import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile, UserRole } from "@/lib/auth/types";

export type { Profile, UserRole } from "@/lib/auth/types";

export function isManagerRole(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, phone, active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.active) return null;
  return data as Profile;
}
