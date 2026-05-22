"use server";

import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";
import {
  searchCustomersForBooking,
  type CustomerBookingPick,
} from "@/lib/hub/customer-lookup-for-booking";

export type HubCustomerLookupState =
  | { ok: true; results: CustomerBookingPick[] }
  | { ok: false; error: string; results: CustomerBookingPick[] };

export async function searchHubCustomersForBooking(
  query: string,
): Promise<HubCustomerLookupState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error, results: [] };
  }

  const results = await searchCustomersForBooking(ctx.supabase, query);
  return { ok: true, results };
}
