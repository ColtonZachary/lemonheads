import { redirect } from "next/navigation";

import { getProfile, isManagerRole } from "@/lib/auth/profile";
import type { HubAccess } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { HubAccess } from "@/lib/auth/types";

export async function requireHubAccess(
  options: { managerOnly?: boolean } = {},
): Promise<HubAccess> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?error=config");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect("/login?error=profile");

  const isManager = isManagerRole(profile.role);
  const isAdmin = profile.role === "admin";

  if (options.managerOnly && !isManager) {
    redirect("/hub/calendar");
  }

  return { profile, isManager, isAdmin };
}
