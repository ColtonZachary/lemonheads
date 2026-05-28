import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Server-side writes for detailer mobile APIs (workflow, photos, checklist).
 * Detailers only have SELECT on bookings via RLS; mutations use service role
 * after the route verifies the booking belongs to the signed-in detailer.
 */
export function getEmployeeMutationClient(): SupabaseClient | null {
  return getSupabaseAdmin();
}
