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
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import {
  fetchDetailerPackageBlocksMap,
  filterDetailersForPackage,
} from "@/lib/bookings/staff-package-blocks";
import { DETAILER_NAMES } from "@/lib/data";
import { fetchActiveDateOverrides } from "@/lib/bookings/date-overrides";
import { fetchActiveWeeklyBlocks } from "@/lib/bookings/weekly-blocks";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function getDetailerAvailability(
  dateLabel: string,
  durationHours: number,
  packageKey?: string,
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
    const [existing, weeklyBlocks, openDayOverrides, detailerNames, packageBlocks] =
      await Promise.all([
        fetchBookingsForDate(client, probe.appointmentDate),
        fetchActiveWeeklyBlocks(client),
        fetchActiveDateOverrides(client),
        fetchBookableDetailerNames(client),
        fetchDetailerPackageBlocksMap(client),
      ]);
    const eligibleDetailers = packageKey?.trim()
      ? filterDetailersForPackage(detailerNames, packageKey, packageBlocks)
      : detailerNames;
    return buildAvailabilitySnapshot(
      dateLabel,
      durationHours,
      BOOKING_TIME_SLOTS,
      eligibleDetailers,
      existing,
      weeklyBlocks,
      openDayOverrides,
    );
  } catch (err) {
    console.error("[booking-availability]", err);
    return empty;
  }
}
