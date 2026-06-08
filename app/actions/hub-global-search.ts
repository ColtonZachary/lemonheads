"use server";

import { getProfile, isManagerRole } from "@/lib/auth/profile";
import {
  searchHubGlobal,
  type HubSearchResult,
} from "@/lib/hub/global-search";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HubGlobalSearchState =
  | { ok: true; results: HubSearchResult[] }
  | { ok: false; error: string; results: HubSearchResult[] };

export async function searchHubGlobalAction(
  query: string,
): Promise<HubGlobalSearchState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured.", results: [] };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in required.", results: [] };
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    return { ok: false, error: "Profile not found.", results: [] };
  }

  const results = await searchHubGlobal(supabase, query, {
    isManager: isManagerRole(profile.role),
    isAdmin: profile.role === "admin",
  });

  return { ok: true, results };
}
