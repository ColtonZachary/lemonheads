import type { SupabaseClient } from "@supabase/supabase-js";

import { logLoyaltyDbIssue } from "@/lib/hub/loyalty-schema";

/** Link signed-in auth user to customers row by email (optional rewards login). */
export async function linkCustomerAuthUser(
  client: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await client.rpc("link_customer_auth_user");
  if (error) {
    logLoyaltyDbIssue("link customer", error.message);
    return null;
  }
  return typeof data === "string" ? data : null;
}
