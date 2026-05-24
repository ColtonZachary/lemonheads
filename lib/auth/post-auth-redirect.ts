import type { SupabaseClient } from "@supabase/supabase-js";

import { getProfile, isManagerRole } from "@/lib/auth/profile";

/**
 * After email link sign-in, pick the right destination when Supabase lands on Site URL
 * without a `next` param (redirect URL not allowlisted).
 */
export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  requestedNext: string | null,
): Promise<string> {
  if (requestedNext?.startsWith("/")) {
    return requestedNext;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";

  const profile = await getProfile(supabase, user.id);
  if (profile && (isManagerRole(profile.role) || profile.role === "detailer")) {
    return "/auth/set-password";
  }

  return "/rewards";
}
