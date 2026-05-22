import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeHubTheme, type HubTheme } from "@/lib/hub/hub-theme";

export function isHubThemeColumnMissing(error: { message?: string; code?: string }): boolean {
  return (
    error.code === "42703" ||
    (error.message?.includes("hub_theme") ?? false)
  );
}

export type HubThemeFetchResult = {
  theme: HubTheme;
  /** False when profiles.hub_theme column is not in the database yet */
  schemaReady: boolean;
};

export async function fetchHubThemeForProfile(
  client: SupabaseClient,
  profileId: string,
): Promise<HubThemeFetchResult> {
  const { data, error } = await client
    .from("profiles")
    .select("hub_theme")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    if (!isHubThemeColumnMissing(error)) {
      console.error("[hub-theme] fetch:", error.message);
    }
    return {
      theme: {},
      schemaReady: !isHubThemeColumnMissing(error),
    };
  }

  return {
    theme: normalizeHubTheme(data?.hub_theme),
    schemaReady: true,
  };
}
