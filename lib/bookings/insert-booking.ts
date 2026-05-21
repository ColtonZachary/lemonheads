import type { SupabaseClient } from "@supabase/supabase-js";

import type { BookingInput } from "@/lib/booking-types";
import { DETAILER_NAMES } from "@/lib/data";
import {
  fetchBookingsForDate,
  resolveDetailerAssignment,
} from "@/lib/bookings/detailer-availability";
import { fetchActiveWeeklyBlocks } from "@/lib/bookings/weekly-blocks";
import {
  parseBookingSchedule,
  parsePriceCents,
} from "@/lib/bookings/parse-schedule";
import { validateBookingSchedule } from "@/lib/bookings/scheduling-limits";

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
  const scheduleError = validateBookingSchedule(data.date, data.time);
  if (scheduleError) {
    return { ok: false, error: scheduleError };
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

  const weeklyBlocks = await fetchActiveWeeklyBlocks(client);
  const assignment = resolveDetailerAssignment(
    data,
    existing,
    DETAILER_NAMES,
    weeklyBlocks,
  );
  if (!assignment.ok) {
    return { ok: false, error: assignment.message };
  }

  const priceCents = parsePriceCents(data.estimatedTotal);
  const row = {
    ...buildBookingRow(referenceId, data, assignment),
    status: options?.status ?? "pending",
    manager_notes: options?.managerNotes ?? "",
    estimated_price_cents: priceCents,
    final_price_cents: priceCents,
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

  return {
    ok: true,
    bookingId: inserted.id,
    detailerName: assignment.detailerName,
    detailerAutoAssigned: assignment.detailerAutoAssigned,
  };
}
