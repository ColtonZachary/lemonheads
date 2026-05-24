"use server";

import { revalidatePath } from "next/cache";

import { getProfile, isManagerRole } from "@/lib/auth/profile";
import { syncLoyaltyPointsForBooking } from "@/lib/hub/loyalty-points";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HubCalendarActionState = {
  ok: boolean;
  message: string;
};

function revalidateCalendar() {
  revalidatePath("/hub/calendar");
}

export async function setBookingBilled(
  _prev: HubCalendarActionState,
  formData: FormData,
): Promise<HubCalendarActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const billed = String(formData.get("billed") ?? "") === "true";

  if (!bookingId) {
    return { ok: false, message: "Missing booking." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in required." };

  const profile = await getProfile(supabase, user.id);
  if (!profile || !isManagerRole(profile.role)) {
    return { ok: false, message: "Managers only." };
  }

  const { data: existing } = await supabase
    .from("bookings")
    .select("billed_at")
    .eq("id", bookingId)
    .maybeSingle();

  const wasBilled = Boolean(existing?.billed_at);

  const { error } = await supabase
    .from("bookings")
    .update({ billed_at: billed ? new Date().toISOString() : null })
    .eq("id", bookingId);

  if (error) {
    if (error.message.includes("billed_at")) {
      return {
        ok: false,
        message:
          "Run the billed_at migration in Supabase (see supabase/migrations/20260529000000_hub_calendar_billed.sql).",
      };
    }
    return { ok: false, message: error.message };
  }

  if (wasBilled !== billed) {
    await syncLoyaltyPointsForBooking(supabase, bookingId, billed, profile.id);
  }

  revalidateCalendar();
  revalidatePath(`/hub/bookings/${bookingId}`);
  revalidatePath("/rewards");
  return {
    ok: true,
    message: billed ? "Marked as billed." : "Billed status cleared.",
  };
}
