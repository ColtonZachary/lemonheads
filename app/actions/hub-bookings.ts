"use server";

import { revalidatePath } from "next/cache";

import { getProfile, isManagerRole, type Profile } from "@/lib/auth/profile";
import { recordBookingAudit } from "@/lib/hub/booking-audit";
import {
  bookingDurationHours,
  dateInputToLabel,
} from "@/lib/hub/schedule-labels";
import {
  insertBooking,
  type BookingInsertOptions,
} from "@/lib/bookings/insert-booking";
import {
  BOOKING_LOCATION_TYPES,
  BOOKING_TIME_SLOTS,
} from "@/lib/bookings/constants";
import {
  fetchBookingsForDate,
  findAvailableDetailer,
  isDetailerAvailable,
} from "@/lib/bookings/detailer-availability";
import { fetchActiveDateOverrides } from "@/lib/bookings/date-overrides";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { fetchActiveWeeklyBlocks } from "@/lib/bookings/weekly-blocks";
import { parseBookingSchedule } from "@/lib/bookings/parse-schedule";
import {
  validateBookingScheduleFromInput,
  validateScheduleChangeFromInput,
} from "@/lib/bookings/scheduling-limits";
import {
  ADDONS,
  PACKAGE_BY_KEY,
  type PackageKey,
  VEHICLE_OPTIONS,
  type VehicleKey,
} from "@/lib/data";
import { generateBookingReferenceId } from "@/lib/hub/booking-reference";
import { BookingSchema, type BookingInput } from "@/lib/booking-types";
import {
  parseHubBookingCreateDraft,
  type HubBookingCreateDraft,
} from "@/lib/hub/booking-create-draft";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HubBookingActionState = {
  ok: boolean;
  message: string;
  bookingId?: string;
  /** Preserved when create booking fails so the form is not cleared. */
  draft?: HubBookingCreateDraft;
};

function createBookingFailed(
  message: string,
  formData: FormData,
): HubBookingActionState {
  return {
    ok: false,
    message,
    draft: parseHubBookingCreateDraft(formData),
  };
}

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

  const scheduleError = validateScheduleChangeFromInput(
    dateInput,
    timeLabel,
    existing.starts_at,
  );
  if (scheduleError) {
    return { ok: false, message: scheduleError };
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

  const [dayBookings, weeklyBlocks, openDayOverrides, detailerNames] =
    await Promise.all([
      fetchBookingsForDate(supabase, schedule.appointmentDate, {
        excludeBookingId: bookingId,
      }),
      fetchActiveWeeklyBlocks(supabase),
      fetchActiveDateOverrides(supabase),
      fetchBookableDetailerNames(supabase),
    ]);
  const availabilityOpts = {
    weeklyBlocks,
    openDayOverrides,
    appointmentDateInput: schedule.appointmentDate,
  };

  if (autoAssign) {
    const assigned = findAvailableDetailer(
      detailerNames,
      dayBookings,
      schedule.startsAt,
      schedule.endsAt,
      availabilityOpts,
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
    if (!detailerNames.includes(detailerChoice)) {
      return { ok: false, message: "Unknown or inactive detailer." };
    }
    if (
      !isDetailerAvailable(
        detailerChoice,
        dayBookings,
        schedule.startsAt,
        schedule.endsAt,
        availabilityOpts,
      )
    ) {
      return {
        ok: false,
        message: `${detailerChoice} is not available at that time (may be booked or on a recurring day off).`,
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

function hubPriceTotal(
  packageKey: PackageKey,
  vehicleKey: VehicleKey,
  addonNames: string[],
): string {
  const pkg = PACKAGE_BY_KEY[packageKey];
  if (!pkg) return "TBD";
  let total = pkg.prices[vehicleKey] ?? 0;
  for (const name of addonNames) {
    const addon = ADDONS.find((a) => a.name === name);
    if (addon) total += addon.price;
  }
  return `$${total}`;
}

export async function createHubBooking(
  _prev: HubBookingActionState,
  formData: FormData,
): Promise<HubBookingActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) {
    return createBookingFailed(ctx.error, formData);
  }

  const { supabase, profile } = ctx;

  const packageKey = String(formData.get("package_key") ?? "") as PackageKey;
  const vehicleKey = String(formData.get("vehicle_key") ?? "") as VehicleKey;
  const pkg = PACKAGE_BY_KEY[packageKey];
  const vehicle = VEHICLE_OPTIONS.find((v) => v.key === vehicleKey);

  if (!pkg || !vehicle) {
    return createBookingFailed("Select a valid package and vehicle.", formData);
  }

  const dateInput = String(formData.get("appointment_date") ?? "");
  const timeLabel = String(formData.get("time") ?? "");
  const detailerChoice = String(formData.get("detailer") ?? "");
  const location = String(formData.get("location") ?? "");
  const status = String(formData.get("status") ?? "confirmed");
  const addonNames = formData.getAll("addons").map(String);

  if (!BOOKING_LOCATION_TYPES.includes(location as (typeof BOOKING_LOCATION_TYPES)[number])) {
    return createBookingFailed("Select a location type.", formData);
  }

  let dateLabel: string;
  try {
    dateLabel = dateInputToLabel(dateInput);
  } catch {
    return createBookingFailed("Invalid appointment date.", formData);
  }

  if (!BOOKING_TIME_SLOTS.includes(timeLabel as (typeof BOOKING_TIME_SLOTS)[number])) {
    return createBookingFailed("Invalid time slot.", formData);
  }

  const scheduleError = validateBookingScheduleFromInput(dateInput, timeLabel);
  if (scheduleError) {
    return createBookingFailed(scheduleError, formData);
  }

  const validStatuses = [
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return createBookingFailed("Invalid status.", formData);
  }

  const input: BookingInput = {
    customerName: String(formData.get("customer_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    service: pkg.name,
    serviceKey: packageKey,
    vehicleKey,
    vehicle: vehicle.label,
    promoCode: "",
    vehicleInfo: String(formData.get("vehicle_info") ?? ""),
    date: dateLabel,
    time: timeLabel,
    location,
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    zip: String(formData.get("zip") ?? ""),
    requestedDetailer: detailerChoice === "auto" ? "" : detailerChoice,
    durationHours: pkg.durationHours,
    addons: addonNames,
    estimatedTotal: hubPriceTotal(packageKey, vehicleKey, addonNames),
    plasticCondition:
      String(formData.get("plastic_shine") ?? "No") === "Yes" ? "Yes" : "No",
    earlyContact: "Yes",
    notes: String(formData.get("customer_notes") ?? ""),
    cardOnFile: false,
  };

  const parsed = BookingSchema.safeParse(input);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return createBookingFailed(first ?? "Check required fields.", formData);
  }

  const referenceId = generateBookingReferenceId();
  const saved = await insertBooking(supabase, referenceId, parsed.data, {
    status: status as BookingInsertOptions["status"],
    managerNotes: String(formData.get("manager_notes") ?? ""),
  });

  if (!saved.ok) {
    return createBookingFailed(saved.error, formData);
  }

  await recordBookingAudit(
    supabase,
    saved.bookingId,
    profile.id,
    "booking.created",
    {
      reference_id: referenceId,
      source: "hub",
      detailer: saved.detailerName,
    },
  );

  revalidatePath("/hub/bookings");
  revalidatePath("/hub/calendar");
  revalidatePath(`/hub/bookings/${saved.bookingId}`);

  return {
    ok: true,
    message: `Booking ${referenceId} created.`,
    bookingId: saved.bookingId,
  };
}
