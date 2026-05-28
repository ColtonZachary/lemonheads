import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchLoyaltySettings,
  pointsForSpendCents,
} from "@/lib/hub/loyalty-db";

type BookingForLoyalty = {
  id: string;
  customer_id: string | null;
  billed_at: string | null;
  final_price_cents: number | null;
  price_cents: number | null;
  estimated_price_cents: number | null;
  promo_code_id: string | null;
};

function bookingSpendCents(booking: BookingForLoyalty): number {
  return (
    booking.final_price_cents ??
    booking.price_cents ??
    booking.estimated_price_cents ??
    0
  );
}

/** Award or reverse loyalty points when billed status changes. */
export async function syncLoyaltyPointsForBooking(
  client: SupabaseClient,
  bookingId: string,
  isBilled: boolean,
  actorId?: string | null,
): Promise<void> {
  const { data: booking, error } = await client
    .from("bookings")
    .select(
      "id, customer_id, billed_at, final_price_cents, price_cents, estimated_price_cents, promo_code_id",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !booking) {
    if (error) console.error("[loyalty] booking fetch:", error.message);
    return;
  }

  const row = booking as BookingForLoyalty;
  if (!row.customer_id) return;

  const { data: earnTx } = await client
    .from("loyalty_transactions")
    .select("id, points")
    .eq("booking_id", bookingId)
    .eq("kind", "earn")
    .maybeSingle();

  if (isBilled) {
    if (earnTx) return;

    const settings = await fetchLoyaltySettings(client);
    if (!settings.enabled) return;

    if (row.promo_code_id) return;

    const amountCents = bookingSpendCents(row);
    const points = pointsForSpendCents(amountCents, settings.points_per_dollar);
    if (points <= 0) return;

    const { data: customer } = await client
      .from("customers")
      .select("points_balance")
      .eq("id", row.customer_id)
      .single();

    if (!customer) return;

    const newBalance = (customer.points_balance ?? 0) + points;

    const { error: balanceError } = await client
      .from("customers")
      .update({ points_balance: newBalance })
      .eq("id", row.customer_id);

    if (balanceError) {
      console.error("[loyalty] balance update:", balanceError.message);
      return;
    }

    const { error: txError } = await client.from("loyalty_transactions").insert({
      customer_id: row.customer_id,
      booking_id: bookingId,
      kind: "earn",
      points,
      amount_cents: amountCents,
      note: `Points for billed booking`,
      ...(actorId ? { created_by: actorId } : {}),
    });

    if (txError) {
      console.error("[loyalty] earn insert:", txError.message);
      await client
        .from("customers")
        .update({ points_balance: customer.points_balance ?? 0 })
        .eq("id", row.customer_id);
    }
    return;
  }

  if (!earnTx) return;

  const pointsToReverse = earnTx.points as number;
  if (pointsToReverse <= 0) return;

  const { data: customer } = await client
    .from("customers")
    .select("points_balance")
    .eq("id", row.customer_id)
    .single();

  if (!customer) return;

  const newBalance = Math.max(0, (customer.points_balance ?? 0) - pointsToReverse);

  await client
    .from("customers")
    .update({ points_balance: newBalance })
    .eq("id", row.customer_id);

  await client.from("loyalty_transactions").delete().eq("id", earnTx.id);

  await client.from("loyalty_transactions").insert({
    customer_id: row.customer_id,
    booking_id: bookingId,
    kind: "reverse",
    points: -pointsToReverse,
    note: "Billed status cleared — points reversed",
    ...(actorId ? { created_by: actorId } : {}),
  });
}
