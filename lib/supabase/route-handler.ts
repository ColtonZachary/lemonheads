import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function createSupabaseRouteHandlerClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
