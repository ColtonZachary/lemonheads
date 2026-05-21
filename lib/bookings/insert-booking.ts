import type { SupabaseClient } from "@supabase/supabase-js";

import type { VehicleKey } from "@/lib/data";
import type { BookingInput } from "@/lib/booking-types";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { computeBookingPricing } from "@/lib/promos/booking-pricing";
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
  validateBookingLocationCoverage,
} from "@/lib/bookings/service-area-coverage";
import {
  fetchSchedulingRules,
  resolveServiceAreaSlugsForLocation,
} from "@/lib/bookings/scheduling-rules";
import { validateBookingSchedule } from "@/lib/bookings/scheduling-limits";
import { syncCustomerFromBooking } from "@/lib/hub/sync-customer-from-booking";

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
  const [schedulingRules, coverageRules] = await Promise.all([
    fetchSchedulingRules(client),
    fetchActiveCoverageRules(client),
  ]);

  const serviceAreaSlugs = resolveServiceAreaSlugsForLocation(
    data.zip ?? "",
    data.city ?? "",
    coverageRules,
  );

  const scheduleError = validateBookingSchedule(
    data.date,
    data.time,
    schedulingRules,
    serviceAreaSlugs,
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

  const [weeklyBlocks, openDayOverrides, detailerNames] = await Promise.all([
    fetchActiveWeeklyBlocks(client),
    fetchActiveDateOverrides(client),
    fetchBookableDetailerNames(client),
  ]);
  const assignment = resolveDetailerAssignment(
    data,
    existing,
    detailerNames,
    weeklyBlocks,
    openDayOverrides,
  );
  if (!assignment.ok) {
    return { ok: false, error: assignment.message };
  }

  const serviceKey = data.serviceKey?.trim() ?? "";
  const vehicleKey = data.vehicleKey?.trim() as VehicleKey;
  const pricing = await computeBookingPricing(client, {
    packageKey: serviceKey,
    vehicleKey,
    addonNames: data.addons ?? [],
    promoCode: data.promoCode?.trim() || undefined,
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
  };

  const { data: inserted, error } = await client
    .from("bookings")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[bookings] insert failed:", error.message);
    return { ok: false, error: error.message };
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
