import type { SupabaseClient } from "@supabase/supabase-js";

import type { BookingInput } from "@/lib/booking-types";

/** Upsert customers row and return id for linking on bookings. */
export async function syncCustomerFromBooking(
  client: SupabaseClient,
  data: BookingInput,
  bookedAt: string,
): Promise<string | null> {
  const email = data.email.trim().toLowerCase();
  if (!email) return null;

  const { data: existing } = await client
    .from("customers")
    .select("id, booking_count")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await client
      .from("customers")
      .update({
        phone: data.phone.trim(),
        display_name: data.customerName.trim(),
        booking_count: existing.booking_count + 1,
        last_booking_at: bookedAt,
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) {
      console.error("[customers] update:", error.message);
      return existing.id;
    }
    return updated?.id ?? existing.id;
  }

  const { data: inserted, error } = await client
    .from("customers")
    .insert({
      email,
      phone: data.phone.trim(),
      display_name: data.customerName.trim(),
      booking_count: 1,
      first_booking_at: bookedAt,
      last_booking_at: bookedAt,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[customers] insert:", error.message);
    return null;
  }

  return inserted?.id ?? null;
}
