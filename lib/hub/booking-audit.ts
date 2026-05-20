import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordBookingAudit(
  supabase: SupabaseClient,
  bookingId: string,
  actorId: string,
  action: string,
  changes: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("booking_audit_log").insert({
    booking_id: bookingId,
    actor_id: actorId,
    action,
    changes,
  });

  if (error) {
    console.error("[hub] audit log failed:", error.message);
  }
}
