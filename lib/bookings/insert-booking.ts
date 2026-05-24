import type { SupabaseClient } from "@supabase/supabase-js";

import type { VehicleKey } from "@/lib/data";
import type { BookingInput } from "@/lib/booking-types";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { computeCheckoutPricing } from "@/lib/bookings/checkout-pricing";
import { incrementPromoUse } from "@/lib/promos/promo-validate";
import {
  fetchBookingsForDate,
  resolveDetailerAssignment,
} from "@/lib/bookings/detailer-availability";
import { fetchActiveDateOverrides } from "@/lib/bookings/date-overrides";
import { fetchActiveWeeklyBlocks } from "@/lib/bookings/weekly-blocks";
import {
  parseBookingSchedule,
  parsePriceCents,
} from "@/lib/bookings/parse-schedule";
import {
  fetchActiveCoverageRules,
  locationRequiresCoverageCheck,
  validateBookingLocationCoverage,
} from "@/lib/bookings/service-area-coverage";
import {
  buildLocationSchedulingContext,
  fetchServiceAreaTravelMap,
} from "@/lib/bookings/location-scheduling";
import {
  fetchSchedulingRules,
  resolveServiceAreaSlugsForLocation,
} from "@/lib/bookings/scheduling-rules";
import { validateBookingSchedule } from "@/lib/bookings/scheduling-limits";
import { syncCustomerFromBooking } from "@/lib/hub/sync-customer-from-booking";
import { isSupabaseMissingColumn } from "@/lib/supabase/schema-errors";
import {
  fetchDetailerPackageBlocksMap,
  filterDetailersForPackage,
  isDetailerBlockedForPackage,
} from "@/lib/bookings/staff-package-blocks";
import {
  fetchDetailerServiceAreasMap,
  filterDetailersForServiceAreas,
  isDetailerAllowedInServiceAreas,
} from "@/lib/bookings/staff-service-areas";

export type BookingInsertRow = {
  reference_id: string;
  customer_name: string;
  email: string;
  phone: string;
  location_type: string;
  address_line: string;
  city: string;
  zip: string;
  service_name: string;
  service_key: string | null;
  vehicle_type: string;
  vehicle_info: string;
  appointment_date: string;
  starts_at: string;
  ends_at: string;
  detailer_name: string | null;
  detailer_auto_assigned: boolean;
  addons: string[];
  plastic_shine: boolean;
  early_contact_ok: boolean;
  price_cents: number | null;
  price_display: string;
  customer_notes: string;
  card_on_file: boolean;
  customer_id?: string | null;
};

export function buildBookingRow(
  referenceId: string,
  data: BookingInput,
  assignment: {
    detailerName: string;
    detailerAutoAssigned: boolean;
    schedule: {
      appointmentDate: string;
      startsAt: string;
      endsAt: string;
    };
  },
): BookingInsertRow {
  const { detailerName, detailerAutoAssigned, schedule } = assignment;

  return {
    reference_id: referenceId,
    customer_name: data.customerName,
    email: data.email,
    phone: data.phone,
    location_type: data.location,
    address_line: data.address ?? "",
    city: data.city ?? "",
    zip: data.zip ?? "",
    service_name: data.service,
    service_key: data.serviceKey?.trim() || null,
    vehicle_type: data.vehicle,
    vehicle_info: data.vehicleInfo ?? "",
    appointment_date: schedule.appointmentDate,
    starts_at: schedule.startsAt,
    ends_at: schedule.endsAt,
    detailer_name: detailerName,
    detailer_auto_assigned: detailerAutoAssigned,
    addons: data.addons ?? [],
    plastic_shine: data.plasticCondition === "Yes",
    early_contact_ok: data.earlyContact === "Yes",
    price_cents: parsePriceCents(data.estimatedTotal),
    price_display: data.estimatedTotal ?? "",
    customer_notes: data.notes ?? "",
    card_on_file: data.cardOnFile ?? false,
  };
}

export type BookingInsertOptions = {
  status?: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  managerNotes?: string;
  /** Use customer-facing copy when location is outside service area (default true). */
  coverageCustomerFacing?: boolean;
  /**
   * When true (default), detailers blocked for the selected package cannot be assigned
   * on the public booking flow. Hub bookings should pass false.
   */
  enforceDetailerPackageBlocks?: boolean;
  /** When false, hub can override travel-time slot rules (default true). */
  enforceLocationScheduling?: boolean;
};

export async function insertBooking(
  client: SupabaseClient,
  referenceId: string,
  data: BookingInput,
  options?: BookingInsertOptions,
): Promise<
  | {
      ok: true;
      bookingId: string;
      detailerName: string;
      detailerAutoAssigned: boolean;
    }
  | { ok: false; error: string }
> {
  const [schedulingRules, coverageRules, travelBySlug] = await Promise.all([
    fetchSchedulingRules(client),
    fetchActiveCoverageRules(client),
    fetchServiceAreaTravelMap(client),
  ]);

  const serviceAreaSlugs = resolveServiceAreaSlugsForLocation(
    data.zip ?? "",
    data.city ?? "",
    coverageRules,
  );

  const locationContext =
    options?.enforceLocationScheduling === false
      ? null
      : buildLocationSchedulingContext(
          data.location,
          data.zip ?? "",
          data.city ?? "",
          coverageRules,
          travelBySlug,
        );

  const scheduleError = validateBookingSchedule(
    data.date,
    data.time,
    schedulingRules,
    serviceAreaSlugs,
    locationContext,
  );
  if (scheduleError) {
    return { ok: false, error: scheduleError };
  }

  const coverageResult = validateBookingLocationCoverage(
    data.location,
    data.zip ?? "",
    data.city ?? "",
    coverageRules,
    { customerFacing: options?.coverageCustomerFacing !== false },
  );
  if (!coverageResult.ok) {
    return { ok: false, error: coverageResult.message };
  }

  const { appointmentDate } = parseBookingSchedule(
    data.date,
    data.time,
    data.durationHours,
  );

  let existing;
  try {
    existing = await fetchBookingsForDate(client, appointmentDate);
  } catch {
    return {
      ok: false,
      error:
        "We couldn't verify schedule availability. Please try again or call 833-536-6648.",
    };
  }

  const [weeklyBlocks, openDayOverrides, detailerNames, packageBlocks, serviceAreasMap] =
    await Promise.all([
      fetchActiveWeeklyBlocks(client),
      fetchActiveDateOverrides(client),
      fetchBookableDetailerNames(client),
      options?.enforceDetailerPackageBlocks === false
        ? Promise.resolve({})
        : fetchDetailerPackageBlocksMap(client),
      fetchDetailerServiceAreasMap(client),
    ]);

  const serviceKey = data.serviceKey?.trim() ?? "";
  const enforcePackageBlocks = options?.enforceDetailerPackageBlocks !== false;
  let eligibleDetailers = detailerNames;
  const requested = data.requestedDetailer?.trim() ?? "";

  if (enforcePackageBlocks && serviceKey) {
    eligibleDetailers = filterDetailersForPackage(
      detailerNames,
      serviceKey,
      packageBlocks,
    );
    if (requested && isDetailerBlockedForPackage(packageBlocks, requested, serviceKey)) {
      return {
        ok: false,
        error: `${requested} is not available for this service when booking online. Choose another detailer, use auto-assign, or call 833-536-6648.`,
      };
    }
    if (!requested && eligibleDetailers.length === 0) {
      return {
        ok: false,
        error:
          "No detailers are available for this service at that time. Please call 833-536-6648.",
      };
    }
  }

  if (locationRequiresCoverageCheck(data.location) && serviceAreaSlugs.length) {
    eligibleDetailers = filterDetailersForServiceAreas(
      eligibleDetailers,
      serviceAreaSlugs,
      serviceAreasMap,
    );
    if (
      requested &&
      !isDetailerAllowedInServiceAreas(serviceAreasMap, requested, serviceAreaSlugs)
    ) {
      return {
        ok: false,
        error: `${requested} is not scheduled for this service area. Choose another detailer, use auto-assign, or call 833-536-6648.`,
      };
    }
    if (!requested && eligibleDetailers.length === 0) {
      return {
        ok: false,
        error:
          "No detailers are available in this service area at that time. Please call 833-536-6648.",
      };
    }
  }

  const assignment = resolveDetailerAssignment(
    data,
    existing,
    eligibleDetailers,
    weeklyBlocks,
    openDayOverrides,
  );
  if (!assignment.ok) {
    return { ok: false, error: assignment.message };
  }

  const vehicleKey = data.vehicleKey?.trim() as VehicleKey;
  const pricing = await computeCheckoutPricing(client, {
    packageKey: serviceKey,
    vehicleKey,
    addonNames: data.addons ?? [],
    promoCode: data.promoCode?.trim() || undefined,
    loyaltyRedemptionId: data.loyaltyRedemptionId?.trim() || undefined,
  });

  if (!pricing.ok) {
    return { ok: false, error: pricing.message };
  }

  const customerId = await syncCustomerFromBooking(
    client,
    data,
    assignment.schedule.startsAt,
  );

  const row = {
    ...buildBookingRow(referenceId, data, assignment),
    status: options?.status ?? "pending",
    manager_notes: options?.managerNotes ?? "",
    estimated_price_cents: pricing.subtotalCents,
    discount_cents: pricing.discountCents,
    final_price_cents: pricing.totalCents,
    promo_code_id: pricing.promoCodeId,
    price_cents: pricing.totalCents,
    price_display: formatCentsDisplay(pricing.totalCents),
    ...(customerId ? { customer_id: customerId } : {}),
    ...(pricing.loyaltyRedemptionId
      ? { loyalty_redemption_id: pricing.loyaltyRedemptionId }
      : {}),
  };

  let inserted: { id: string } | null = null;
  let insertError: { message?: string; code?: string } | null = null;

  const attemptInsert = async (payload: typeof row) =>
    client.from("bookings").insert(payload).select("id").single();

  ({ data: inserted, error: insertError } = await attemptInsert(row));

  if (
    insertError &&
    pricing.loyaltyRedemptionId &&
    isSupabaseMissingColumn(insertError, "loyalty_redemption_id")
  ) {
    console.warn(
      "[bookings] loyalty_redemption_id column missing — booking saved without link. Run migration 20260605000000_booking_loyalty_redemption.sql",
    );
    const { loyalty_redemption_id: _ignored, ...rowWithoutLoyaltyLink } = row;
    ({ data: inserted, error: insertError } = await attemptInsert(
      rowWithoutLoyaltyLink,
    ));
  }

  if (insertError || !inserted) {
    console.error("[bookings] insert failed:", insertError?.message);
    return { ok: false, error: insertError?.message ?? "Booking could not be saved." };
  }

  if (pricing.loyaltyRedemptionId) {
    await client
      .from("loyalty_redemptions")
      .update({
        booking_id: inserted.id,
        status: "fulfilled",
        fulfilled_at: new Date().toISOString(),
      })
      .eq("id", pricing.loyaltyRedemptionId)
      .eq("status", "pending");
  }

  if (pricing.promoCodeId) {
    await incrementPromoUse(client, pricing.promoCodeId);
  }

  return {
    ok: true,
    bookingId: inserted.id,
    detailerName: assignment.detailerName,
    detailerAutoAssigned: assignment.detailerAutoAssigned,
  };
}

function formatCentsDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
