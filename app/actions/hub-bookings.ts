"use server";

import { revalidatePath } from "next/cache";

import { getProfile, isManagerRole, type Profile } from "@/lib/auth/profile";
import { recordBookingAudit } from "@/lib/hub/booking-audit";
import {
  bookingDurationHours,
  dateInputToLabel,
} from "@/lib/hub/schedule-labels";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  fetchBookingsForDate,
  findAvailableDetailer,
  isDetailerAvailable,
} from "@/lib/bookings/detailer-availability";
import { parseBookingSchedule } from "@/lib/bookings/parse-schedule";
import { DETAILER_NAMES } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HubBookingActionState = {
  ok: boolean;
  message: string;
};

type ManagerContext =
  | {
      supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
      profile: Profile;
    }
  | { error: string };

async function requireManagerSupabase(): Promise<ManagerContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const profile = await getProfile(supabase, user.id);
  if (!profile || !isManagerRole(profile.role)) {
    return { error: "Managers only." };
  }

  return { supabase, profile };
}

function parseOverrideCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const amount = Number.parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export async function updateHubBooking(
  bookingId: string,
  _prev: HubBookingActionState,
  formData: FormData,
): Promise<HubBookingActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { supabase, profile } = ctx;

  const { data: existing, error: loadError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, message: "Booking not found." };
  }
  if (existing.deleted_at) {
    return { ok: false, message: "This booking was deleted." };
  }

  const status = String(formData.get("status") ?? existing.status);
  const dateInput = String(formData.get("appointment_date") ?? "");
  const timeLabel = String(formData.get("time") ?? "");
  const detailerChoice = String(formData.get("detailer") ?? "");
  const managerNotes = String(formData.get("manager_notes") ?? "");
  const priceOverrideRaw = String(formData.get("price_override") ?? "");

  const validStatuses = [
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return { ok: false, message: "Invalid status." };
  }
  if (!BOOKING_TIME_SLOTS.includes(timeLabel as (typeof BOOKING_TIME_SLOTS)[number])) {
    return { ok: false, message: "Invalid time slot." };
  }

  let dateLabel: string;
  try {
    dateLabel = dateInputToLabel(dateInput);
  } catch {
    return { ok: false, message: "Invalid appointment date." };
  }

  const durationHours = bookingDurationHours(
    existing.starts_at,
    existing.ends_at,
  );

  let schedule;
  try {
    schedule = parseBookingSchedule(dateLabel, timeLabel, durationHours);
  } catch {
    return { ok: false, message: "Could not parse date and time." };
  }

  const autoAssign = detailerChoice === "" || detailerChoice === "auto";
  let detailerName: string | null = null;
  let detailerAutoAssigned = false;

  const dayBookings = await fetchBookingsForDate(supabase, schedule.appointmentDate, {
    excludeBookingId: bookingId,
  });

  if (autoAssign) {
    const assigned = findAvailableDetailer(
      DETAILER_NAMES,
      dayBookings,
      schedule.startsAt,
      schedule.endsAt,
    );
    if (!assigned) {
      return {
        ok: false,
        message:
          "No detailer is free at that time. Pick another slot or assign a specific detailer.",
      };
    }
    detailerName = assigned;
    detailerAutoAssigned = true;
  } else {
    if (!DETAILER_NAMES.includes(detailerChoice)) {
      return { ok: false, message: "Unknown detailer." };
    }
    if (
      !isDetailerAvailable(
        detailerChoice,
        dayBookings,
        schedule.startsAt,
        schedule.endsAt,
      )
    ) {
      return {
        ok: false,
        message: `${detailerChoice} is already booked for that time.`,
      };
    }
    detailerName = detailerChoice;
    detailerAutoAssigned = false;
  }

  const priceOverrideCents = parseOverrideCents(priceOverrideRaw);
  const finalPriceCents =
    priceOverrideCents ??
    existing.final_price_cents ??
    existing.price_override_cents ??
    existing.price_cents ??
    existing.estimated_price_cents;

  const patch = {
    status,
    appointment_date: schedule.appointmentDate,
    starts_at: schedule.startsAt,
    ends_at: schedule.endsAt,
    detailer_name: detailerName,
    detailer_auto_assigned: detailerAutoAssigned,
    manager_notes: managerNotes,
    price_override_cents: priceOverrideCents,
    final_price_cents: finalPriceCents,
    price_display:
      finalPriceCents != null
        ? `$${(finalPriceCents / 100).toFixed(0)}`
        : existing.price_display,
  };

  const { error: updateError } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", bookingId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await recordBookingAudit(supabase, bookingId, profile.id, "booking.updated", {
    before: {
      status: existing.status,
      starts_at: existing.starts_at,
      detailer_name: existing.detailer_name,
      price_override_cents: existing.price_override_cents,
    },
    after: patch,
  });

  revalidatePath("/hub/bookings");
  revalidatePath(`/hub/bookings/${bookingId}`);
  revalidatePath("/hub/calendar");

  return { ok: true, message: "Booking saved." };
}

export async function cancelHubBooking(
  bookingId: string,
  _prev: HubBookingActionState,
  formData: FormData,
): Promise<HubBookingActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const reason = String(formData.get("cancellation_reason") ?? "").trim();
  if (!reason) {
    return { ok: false, message: "Cancellation reason is required." };
  }

  const { supabase, profile } = ctx;
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("bookings")
    .select("status, cancellation_reason")
    .eq("id", bookingId)
    .maybeSingle();

  if (!existing) return { ok: false, message: "Booking not found." };

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: now,
      cancelled_by: profile.id,
    })
    .eq("id", bookingId);

  if (error) return { ok: false, message: error.message };

  await recordBookingAudit(supabase, bookingId, profile.id, "booking.cancelled", {
    reason,
    previous_status: existing.status,
  });

  revalidatePath("/hub/bookings");
  revalidatePath(`/hub/bookings/${bookingId}`);
  revalidatePath("/hub/calendar");

  return { ok: true, message: "Booking cancelled." };
}

export async function deleteHubBookingForm(
  bookingId: string,
  _prev: HubBookingActionState,
  _formData: FormData,
): Promise<HubBookingActionState> {
  void _formData;
  return deleteHubBooking(bookingId);
}

export async function deleteHubBooking(
  bookingId: string,
): Promise<HubBookingActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { supabase, profile } = ctx;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("bookings")
    .update({
      deleted_at: now,
      deleted_by: profile.id,
    })
    .eq("id", bookingId);

  if (error) return { ok: false, message: error.message };

  await recordBookingAudit(supabase, bookingId, profile.id, "booking.deleted", {});

  revalidatePath("/hub/bookings");
  revalidatePath("/hub/calendar");

  return { ok: true, message: "Booking deleted." };
}
