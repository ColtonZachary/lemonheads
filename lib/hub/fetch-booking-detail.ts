import type { SupabaseClient } from "@supabase/supabase-js";

import type { HubBookingDetail } from "@/components/hub/booking-detail-form";
import { isSupabaseMissingColumn } from "@/lib/supabase/schema-errors";

const BOOKING_DETAIL_SELECT = `
  id, reference_id, customer_name, email, phone,
  location_type, address_line, city, zip,
  service_name, service_key, vehicle_type, vehicle_info,
  addons, plastic_shine, customer_notes,
  status, starts_at, ends_at,
  detailer_name, detailer_auto_assigned,
  price_display, price_cents, price_override_cents,
  estimated_price_cents, discount_cents, final_price_cents,
  promo_code_id,
  manager_notes, cancellation_reason, cancelled_at, deleted_at, billed_at,
  detail_phase, detail_en_route_at, detail_arrived_at, detail_finished_at,
  detail_checklist_completed_at,
  promo_codes ( code )
`;

export async function fetchHubBookingDetail(
  client: SupabaseClient,
  bookingId: string,
): Promise<HubBookingDetail | null> {
  const { data: booking, error } = await client
    .from("bookings")
    .select(BOOKING_DETAIL_SELECT)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error("[hub booking detail] load failed:", error.message);
    return null;
  }
  if (!booking) return null;

  let loyalty_redemption_id: string | null = null;
  let loyalty_redemptions: HubBookingDetail["loyalty_redemptions"] = null;

  const { data: loyaltyLink, error: loyaltyLinkError } = await client
    .from("bookings")
    .select("loyalty_redemption_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!loyaltyLinkError && loyaltyLink?.loyalty_redemption_id) {
    loyalty_redemption_id = loyaltyLink.loyalty_redemption_id as string;

    const { data: redemption, error: redemptionError } = await client
      .from("loyalty_redemptions")
      .select(
        `
        id,
        status,
        points_spent,
        loyalty_reward_goals ( title )
      `,
      )
      .eq("id", loyalty_redemption_id)
      .maybeSingle();

    if (redemptionError) {
      console.warn(
        "[hub booking detail] loyalty redemption load:",
        redemptionError.message,
      );
    } else {
      loyalty_redemptions = redemption as HubBookingDetail["loyalty_redemptions"];
    }
  } else if (
    loyaltyLinkError &&
    !isSupabaseMissingColumn(loyaltyLinkError, "loyalty_redemption_id")
  ) {
    console.warn(
      "[hub booking detail] loyalty link load:",
      loyaltyLinkError.message,
    );
  }

  return {
    ...(booking as Omit<
      HubBookingDetail,
      "loyalty_redemption_id" | "loyalty_redemptions"
    >),
    loyalty_redemption_id,
    loyalty_redemptions,
  };
}
