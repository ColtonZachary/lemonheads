"use server";

import { revalidatePath } from "next/cache";

import { getProfile, isManagerRole, type Profile } from "@/lib/auth/profile";
import { recordBookingAudit } from "@/lib/hub/booking-audit";
import { syncLoyaltyPointsForBooking } from "@/lib/hub/loyalty-points";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";
import { computeCheckoutPricing } from "@/lib/bookings/checkout-pricing";
import {
  insertBooking,
  type BookingInsertOptions,
} from "@/lib/bookings/insert-booking";
import { vehicleKeyFromTypeLabel } from "@/lib/bookings/vehicle-key-from-label";
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
  fetchSchedulingRules,
  resolveServiceAreaSlugsForLocation,
} from "@/lib/bookings/scheduling-rules";
import {
  fetchActiveCoverageRules,
  locationRequiresCoverageCheck,
  validateBookingLocationCoverage,
} from "@/lib/bookings/service-area-coverage";
import {
  fetchDetailerServiceAreasMap,
  filterDetailersForServiceAreas,
  isDetailerAllowedInServiceAreas,
} from "@/lib/bookings/staff-service-areas";
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
  getEmailValidationError,
  getPhoneValidationError,
} from "@/lib/validation/contact-fields";
import {
  fetchPackageAddonBlocksMap,
  validatePackageAddonSelection,
} from "@/lib/bookings/package-addon-blocks";
import {
  parseHubBookingCreateDraft,
  type HubBookingCreateDraft,
} from "@/lib/hub/booking-create-draft";
import {
  notifyCustomerBookingCancelled,
  notifyCustomerBookingConfirmed,
  notifyCustomerBookingCreated,
  notifyCustomerBookingRescheduled,
  type CustomerBookingSmsData,
} from "@/lib/notifications/customer-sms";
import { notifyDetailerJobAssigned } from "@/lib/notifications/employee-push";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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
    .select("*, promo_codes ( code )")
    .eq("id", bookingId)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, message: "Booking not found." };
  }
  if (existing.deleted_at) {
    return { ok: false, message: "This booking was deleted." };
  }

  if (existing.billed_at) {
    return {
      ok: false,
      message:
        "This booking is already billed. Unmark billed on the calendar before changing line items or sending an invoice.",
    };
  }

  const { data: paidInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("status", "paid")
    .maybeSingle();

  if (paidInvoice) {
    return {
      ok: false,
      message: "This booking has a paid invoice and can no longer be edited here.",
    };
  }

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!customerName || !email || !phone) {
    return { ok: false, message: "Customer name, email, and phone are required." };
  }
  const emailErr = getEmailValidationError(email);
  if (emailErr) return { ok: false, message: emailErr };
  const phoneErr = getPhoneValidationError(phone);
  if (phoneErr) return { ok: false, message: phoneErr };

  const packageKey = String(formData.get("package_key") ?? "") as PackageKey;
  const vehicleKey = String(formData.get("vehicle_key") ?? "") as VehicleKey;
  const pkg = PACKAGE_BY_KEY[packageKey];
  const vehicle = VEHICLE_OPTIONS.find((v) => v.key === vehicleKey);
  if (!pkg || !vehicle) {
    return { ok: false, message: "Select a valid package and vehicle." };
  }

  const locationType = String(formData.get("location") ?? "");
  const addressLine = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  if (
    !BOOKING_LOCATION_TYPES.includes(
      locationType as (typeof BOOKING_LOCATION_TYPES)[number],
    )
  ) {
    return { ok: false, message: "Select a location type." };
  }

  const addonNames = formData.getAll("addons").map(String);
  const packageAddonBlocks = await fetchPackageAddonBlocksMap(supabase);
  const addonValidation = validatePackageAddonSelection(
    packageKey,
    addonNames,
    packageAddonBlocks,
  );
  if (!addonValidation.ok) {
    return { ok: false, message: addonValidation.message };
  }
  const vehicleInfo = String(formData.get("vehicle_info") ?? "").trim();
  const customerNotes = String(formData.get("customer_notes") ?? "").trim();
  const plasticShine = String(formData.get("plastic_shine") ?? "No") === "Yes";
  const promoCodeRaw = String(formData.get("promo_code") ?? "").trim();

  const status = String(formData.get("status") ?? existing.status);
  const dateInput = String(formData.get("appointment_date") ?? "");
  const timeLabel = String(formData.get("time") ?? "");
  const detailerChoice = String(formData.get("detailer") ?? "");
  const managerNotes = String(formData.get("manager_notes") ?? "");
  const priceOverrideRaw = String(formData.get("price_override") ?? "");
  const billedChecked = String(formData.get("billed") ?? "") === "on";

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

  const [schedulingRules, coverageRules] = await Promise.all([
    fetchSchedulingRules(supabase),
    fetchActiveCoverageRules(supabase),
  ]);

  const coverageResult = validateBookingLocationCoverage(
    locationType,
    zip,
    city,
    coverageRules,
    { customerFacing: false },
  );
  if (!coverageResult.ok) {
    return { ok: false, message: coverageResult.message };
  }

  const serviceAreaSlugs = resolveServiceAreaSlugsForLocation(
    zip,
    city,
    coverageRules,
  );

  const scheduleError = validateScheduleChangeFromInput(
    dateInput,
    timeLabel,
    existing.starts_at,
    schedulingRules,
    serviceAreaSlugs,
  );
  if (scheduleError) {
    return { ok: false, message: scheduleError };
  }

  const durationHours = pkg.durationHours;

  let schedule;
  try {
    schedule = parseBookingSchedule(dateLabel, timeLabel, durationHours);
  } catch {
    return { ok: false, message: "Could not parse date and time." };
  }

  const autoAssign = detailerChoice === "" || detailerChoice === "auto";
  let detailerName: string | null = null;
  let detailerAutoAssigned = false;

  const [dayBookings, weeklyBlocks, openDayOverrides, detailerNames, serviceAreasMap] =
    await Promise.all([
      fetchBookingsForDate(supabase, schedule.appointmentDate, {
        excludeBookingId: bookingId,
      }),
      fetchActiveWeeklyBlocks(supabase),
      fetchActiveDateOverrides(supabase),
      fetchBookableDetailerNames(supabase),
      fetchDetailerServiceAreasMap(supabase),
    ]);
  let eligibleDetailers = detailerNames;
  if (
    locationRequiresCoverageCheck(locationType) &&
    serviceAreaSlugs.length
  ) {
    eligibleDetailers = filterDetailersForServiceAreas(
      eligibleDetailers,
      serviceAreaSlugs,
      serviceAreasMap,
    );
  }
  const availabilityOpts = {
    weeklyBlocks,
    openDayOverrides,
    appointmentDateInput: schedule.appointmentDate,
  };

  if (autoAssign) {
    const assigned = findAvailableDetailer(
      eligibleDetailers,
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
      locationRequiresCoverageCheck(locationType) &&
      serviceAreaSlugs.length &&
      !isDetailerAllowedInServiceAreas(
        serviceAreasMap,
        detailerChoice,
        serviceAreaSlugs,
      )
    ) {
      return {
        ok: false,
        message: `${detailerChoice} is not scheduled for this service area.`,
      };
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
  const promoForPricing = promoCodeRaw || undefined;

  const pricing = await computeCheckoutPricing(supabase, {
    packageKey,
    vehicleKey,
    addonNames,
    promoCode: promoForPricing,
    loyaltyRedemptionId:
      (existing.loyalty_redemption_id as string | null) ?? undefined,
  });

  if (!pricing.ok) {
    return { ok: false, message: pricing.message };
  }

  const finalPriceCents =
    priceOverrideCents ?? pricing.totalCents;

  const patch: Record<string, unknown> = {
    customer_name: customerName,
    email,
    phone,
    location_type: locationType,
    address_line: addressLine,
    city,
    zip,
    service_name: pkg.name,
    service_key: packageKey,
    vehicle_type: vehicle.label,
    vehicle_info: vehicleInfo,
    addons: addonNames,
    plastic_shine: plasticShine,
    customer_notes: customerNotes,
    status,
    appointment_date: schedule.appointmentDate,
    starts_at: schedule.startsAt,
    ends_at: schedule.endsAt,
    detailer_name: detailerName,
    detailer_auto_assigned: detailerAutoAssigned,
    manager_notes: managerNotes,
    estimated_price_cents: pricing.subtotalCents,
    discount_cents: pricing.discountCents,
    promo_code_id: pricing.promoCodeId,
    price_override_cents: priceOverrideCents,
    final_price_cents: finalPriceCents,
    price_cents: finalPriceCents,
    price_display: formatHubBookingPrice(finalPriceCents),
    billed_at: billedChecked
      ? (existing.billed_at as string | null) ?? new Date().toISOString()
      : null,
  };

  const { error: updateError } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", bookingId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const wasBilled = Boolean(existing.billed_at);
  const isBilled = Boolean(patch.billed_at);
  if (wasBilled !== isBilled) {
    await syncLoyaltyPointsForBooking(supabase, bookingId, isBilled, profile.id);
  }

  await recordBookingAudit(supabase, bookingId, profile.id, "booking.updated", {
    before: {
      customer_name: existing.customer_name,
      service_name: existing.service_name,
      status: existing.status,
      starts_at: existing.starts_at,
      detailer_name: existing.detailer_name,
      final_price_cents: existing.final_price_cents,
    },
    after: patch,
  });

  const smsAdmin = getSupabaseAdmin();
  const smsData: CustomerBookingSmsData = {
    phone,
    customerName,
    service: pkg.name,
    date: dateLabel,
    time: timeLabel,
    referenceId: existing.reference_id,
    detailerName: detailerName ?? "Auto-Assigned",
    bookingId,
  };
  const scheduleChanged = existing.starts_at !== patch.starts_at;
  const becameCancelled =
    status === "cancelled" && existing.status !== "cancelled";
  const becameConfirmed =
    status === "confirmed" && existing.status === "pending";

  if (becameCancelled) {
    void notifyCustomerBookingCancelled(smsAdmin, smsData).then((r) => {
      if (!r.ok) console.warn("[hub-booking] cancel SMS:", r.error);
    });
  } else if (scheduleChanged) {
    void notifyCustomerBookingRescheduled(smsAdmin, smsData).then((r) => {
      if (!r.ok) console.warn("[hub-booking] reschedule SMS:", r.error);
    });
  } else if (becameConfirmed) {
    void notifyCustomerBookingConfirmed(smsAdmin, smsData).then((r) => {
      if (!r.ok) console.warn("[hub-booking] confirm SMS:", r.error);
    });
  }

  const detailerChanged =
    detailerName &&
    status !== "cancelled" &&
    existing.detailer_name !== detailerName;
  if (detailerChanged) {
    queueDetailerJobAssignedPush({
      detailerName,
      bookingId,
      referenceId: existing.reference_id as string,
      customerName,
      service: pkg.name,
      date: dateLabel,
      time: timeLabel,
    });
  }

  revalidatePath("/hub/bookings");
  revalidatePath(`/hub/bookings/${bookingId}`);
  revalidatePath("/hub/calendar");
  revalidatePath("/hub/customers");

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

  const packageAddonBlocks = await fetchPackageAddonBlocksMap(supabase);
  const addonValidation = validatePackageAddonSelection(
    packageKey,
    addonNames,
    packageAddonBlocks,
  );
  if (!addonValidation.ok) {
    return createBookingFailed(addonValidation.message, formData);
  }

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

  const [schedulingRules, coverageRules] = await Promise.all([
    fetchSchedulingRules(supabase),
    fetchActiveCoverageRules(supabase),
  ]);
  const city = String(formData.get("city") ?? "");
  const zip = String(formData.get("zip") ?? "");
  const serviceAreaSlugs = resolveServiceAreaSlugsForLocation(
    zip,
    city,
    coverageRules,
  );

  const scheduleError = validateBookingScheduleFromInput(
    dateInput,
    timeLabel,
    schedulingRules,
    serviceAreaSlugs,
  );
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
    loyaltyRedemptionId: "",
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
    enforceDetailerPackageBlocks: false,
    enforceLocationScheduling: false,
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

  void notifyCustomerBookingCreated(getSupabaseAdmin(), {
    phone: parsed.data.phone,
    customerName: parsed.data.customerName,
    service: parsed.data.service,
    date: parsed.data.date,
    time: parsed.data.time,
    referenceId,
    detailerName: saved.detailerName,
    bookingId: saved.bookingId,
  }).then((r) => {
    if (!r.ok) console.warn("[hub-booking] create SMS:", r.error);
  });

  if (status !== "cancelled") {
    queueDetailerJobAssignedPush({
      detailerName: saved.detailerName,
      bookingId: saved.bookingId,
      referenceId,
      customerName: parsed.data.customerName,
      service: parsed.data.service,
      date: parsed.data.date,
      time: parsed.data.time,
    });
  }

  revalidatePath("/hub/bookings");
  revalidatePath("/hub/calendar");
  revalidatePath(`/hub/bookings/${saved.bookingId}`);

  return {
    ok: true,
    message: `Booking ${referenceId} created.`,
    bookingId: saved.bookingId,
  };
}

function formatHubBookingPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function queueDetailerJobAssignedPush(args: {
  detailerName: string;
  bookingId: string;
  referenceId: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
}): void {
  void notifyDetailerJobAssigned(getSupabaseAdmin(), args).then((r) => {
    if (!r.ok) console.warn("[hub-booking] detailer push:", r.error);
  });
}

export async function removeBookingLoyaltyReward(
  bookingId: string,
  _prev: HubBookingActionState,
  _formData: FormData,
): Promise<HubBookingActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { supabase, profile } = ctx;

  const { data: booking, error: loadError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      reference_id,
      service_key,
      vehicle_type,
      addons,
      estimated_price_cents,
      discount_cents,
      final_price_cents,
      price_override_cents,
      price_cents,
      price_display,
      loyalty_redemption_id,
      promo_code_id,
      promo_codes ( code )
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (loadError || !booking) {
    return { ok: false, message: "Booking not found." };
  }
  if (!booking.loyalty_redemption_id) {
    return { ok: false, message: "This booking has no rewards applied." };
  }

  const { data: redemption, error: redemptionError } = await supabase
    .from("loyalty_redemptions")
    .select(
      `
      id,
      customer_id,
      points_spent,
      status,
      loyalty_reward_goals (
        reward_kind,
        reward_addon_name
      )
    `,
    )
    .eq("id", booking.loyalty_redemption_id)
    .maybeSingle();

  if (redemptionError || !redemption) {
    return { ok: false, message: "Reward record not found." };
  }
  if (redemption.status === "cancelled") {
    return { ok: false, message: "This reward was already removed." };
  }

  const goal = redemption.loyalty_reward_goals as
    | { reward_kind: string; reward_addon_name: string | null }
    | { reward_kind: string; reward_addon_name: string | null }[]
    | null;
  const g = Array.isArray(goal) ? goal[0] : goal;

  let nextAddons = [...(booking.addons ?? [])];
  if (g?.reward_kind === "addon" && g.reward_addon_name) {
    nextAddons = nextAddons.filter((name) => name !== g.reward_addon_name);
  }

  const promoRow = booking.promo_codes as
    | { code: string }
    | { code: string }[]
    | null;
  const promoCode = Array.isArray(promoRow)
    ? promoRow[0]?.code
    : promoRow?.code;

  const vehicleKey = vehicleKeyFromTypeLabel(booking.vehicle_type ?? "");
  let nextDiscountCents = 0;
  let nextFinalCents =
    booking.price_override_cents ??
    booking.estimated_price_cents ??
    booking.final_price_cents ??
    0;

  if (booking.service_key && vehicleKey) {
    const pricing = await computeCheckoutPricing(supabase, {
      packageKey: booking.service_key,
      vehicleKey,
      addonNames: nextAddons,
      promoCode: promoCode || undefined,
    });
    if (pricing.ok) {
      nextDiscountCents = pricing.discountCents;
      if (booking.price_override_cents == null) {
        nextFinalCents = pricing.totalCents;
      }
    }
  } else if (!booking.promo_code_id) {
    nextDiscountCents = 0;
    if (booking.price_override_cents == null && booking.estimated_price_cents != null) {
      nextFinalCents = booking.estimated_price_cents;
    }
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("points_balance")
    .eq("id", redemption.customer_id)
    .maybeSingle();

  if (customer) {
    const refund = redemption.points_spent as number;
    const { error: balanceError } = await supabase
      .from("customers")
      .update({
        points_balance: (customer.points_balance ?? 0) + refund,
      })
      .eq("id", redemption.customer_id);

    if (balanceError) {
      return { ok: false, message: balanceError.message };
    }

    await supabase.from("loyalty_transactions").insert({
      customer_id: redemption.customer_id,
      redemption_id: redemption.id,
      kind: "adjust",
      points: refund,
      note: `Reward removed from booking ${booking.reference_id} — points refunded`,
      created_by: profile.id,
    });
  }

  const { error: redemptionUpdateError } = await supabase
    .from("loyalty_redemptions")
    .update({ status: "cancelled", booking_id: null })
    .eq("id", redemption.id);

  if (redemptionUpdateError) {
    return { ok: false, message: redemptionUpdateError.message };
  }

  const patch: Record<string, unknown> = {
    loyalty_redemption_id: null,
    addons: nextAddons,
    discount_cents: nextDiscountCents,
  };

  if (booking.price_override_cents == null) {
    patch.final_price_cents = nextFinalCents;
    patch.price_cents = nextFinalCents;
    patch.price_display = formatHubBookingPrice(nextFinalCents);
  }

  const { error: bookingUpdateError } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", bookingId);

  if (bookingUpdateError) {
    return { ok: false, message: bookingUpdateError.message };
  }

  await recordBookingAudit(supabase, bookingId, profile.id, "booking.reward_removed", {
    redemption_id: redemption.id,
    points_refunded: redemption.points_spent,
    pricing: patch,
  });

  revalidatePath("/hub/calendar");
  revalidatePath("/hub/bookings");
  revalidatePath(`/hub/bookings/${bookingId}`);
  revalidatePath("/hub/settings/loyalty");
  revalidatePath("/rewards");

  return { ok: true, message: "Reward removed. Points refunded and price updated." };
}
