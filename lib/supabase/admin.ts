import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

let cached: SupabaseClient | null = null;

/**
 * Service-role client — bypasses RLS. Use only in trusted server code
 * (e.g. admin uploads, webhooks, invoice jobs). Never import in client components.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
