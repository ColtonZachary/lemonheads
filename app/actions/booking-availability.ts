"use server";

import {
  BOOKING_TIME_SLOTS,
} from "@/lib/bookings/constants";
import {
  buildAvailabilitySnapshot,
  fetchBookingsForDate,
  type DetailerAvailabilitySnapshot,
} from "@/lib/bookings/detailer-availability";
import { parseBookingSchedule } from "@/lib/bookings/parse-schedule";
import { DETAILER_NAMES } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function getDetailerAvailability(
  dateLabel: string,
  durationHours: number,
): Promise<DetailerAvailabilitySnapshot> {
  const empty: DetailerAvailabilitySnapshot = {
    fullyBookedSlots: [],
    busySlotsByDetailer: Object.fromEntries(
      DETAILER_NAMES.map((name) => [name, []]),
    ),
  };

  const client = getSupabaseAdmin();
  if (!client) return empty;

  try {
    const probe = parseBookingSchedule(
      dateLabel,
      BOOKING_TIME_SLOTS[0],
      durationHours,
    );
    const existing = await fetchBookingsForDate(client, probe.appointmentDate);
    return buildAvailabilitySnapshot(
      dateLabel,
      durationHours,
      BOOKING_TIME_SLOTS,
      DETAILER_NAMES,
      existing,
    );
  } catch (err) {
    console.error("[booking-availability]", err);
    return empty;
  }
}
