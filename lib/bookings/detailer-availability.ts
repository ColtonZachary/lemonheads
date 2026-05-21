import type { SupabaseClient } from "@supabase/supabase-js";

import { BLOCKING_BOOKING_STATUSES } from "@/lib/bookings/constants";
import { parseBookingSchedule } from "@/lib/bookings/parse-schedule";
import type { BookingInput } from "@/lib/booking-types";
import {
  isDetailerBlockedByWeeklyRule,
  type StaffWeeklyBlock,
} from "@/lib/bookings/weekly-blocks";

export type ExistingBookingWindow = {
  starts_at: string;
  ends_at: string;
  detailer_name: string | null;
  detailer_auto_assigned: boolean;
};

export type DetailerAssignment =
  | {
      ok: true;
      detailerName: string;
      detailerAutoAssigned: boolean;
      schedule: ReturnType<typeof parseBookingSchedule>;
    }
  | { ok: false; message: string };

export type DetailerAvailabilitySnapshot = {
  fullyBookedSlots: string[];
  busySlotsByDetailer: Record<string, string[]>;
};

export function windowsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const a0 = new Date(startA).getTime();
  const a1 = new Date(endA).getTime();
  const b0 = new Date(startB).getTime();
  const b1 = new Date(endB).getTime();
  return a0 < b1 && a1 > b0;
}

/** True if this row blocks the named detailer for the given window. */
export function bookingBlocksDetailer(
  booking: ExistingBookingWindow,
  detailerName: string,
): boolean {
  if (booking.detailer_name === detailerName) return true;
  // Legacy rows: auto-assign with no name yet blocks all detailers for that slot.
  if (booking.detailer_name === null && booking.detailer_auto_assigned) return true;
  return false;
}

export function isDetailerAvailable(
  detailerName: string,
  existing: ExistingBookingWindow[],
  startsAt: string,
  endsAt: string,
  options?: {
    weeklyBlocks?: StaffWeeklyBlock[];
    appointmentDateInput?: string;
  },
): boolean {
  if (
    options?.weeklyBlocks?.length &&
    options.appointmentDateInput &&
    isDetailerBlockedByWeeklyRule(
      detailerName,
      options.appointmentDateInput,
      options.weeklyBlocks,
    )
  ) {
    return false;
  }

  return !existing.some(
    (row) =>
      bookingBlocksDetailer(row, detailerName) &&
      windowsOverlap(startsAt, endsAt, row.starts_at, row.ends_at),
  );
}

export function findAvailableDetailer(
  detailerNames: readonly string[],
  existing: ExistingBookingWindow[],
  startsAt: string,
  endsAt: string,
  options?: {
    weeklyBlocks?: StaffWeeklyBlock[];
    appointmentDateInput?: string;
  },
): string | null {
  return (
    detailerNames.find((name) =>
      isDetailerAvailable(name, existing, startsAt, endsAt, options),
    ) ?? null
  );
}

export async function fetchBookingsForDate(
  client: SupabaseClient,
  appointmentDate: string,
  options?: { excludeBookingId?: string },
): Promise<ExistingBookingWindow[]> {
  let query = client
    .from("bookings")
    .select("starts_at, ends_at, detailer_name, detailer_auto_assigned")
    .eq("appointment_date", appointmentDate)
    .in("status", [...BLOCKING_BOOKING_STATUSES])
    .is("deleted_at", null);

  if (options?.excludeBookingId) {
    query = query.neq("id", options.excludeBookingId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[bookings] availability fetch failed:", error.message);
    throw new Error("Could not check schedule availability.");
  }

  return (data ?? []) as ExistingBookingWindow[];
}

export function resolveDetailerAssignment(
  data: BookingInput,
  existing: ExistingBookingWindow[],
  detailerNames: readonly string[],
  weeklyBlocks: StaffWeeklyBlock[] = [],
): DetailerAssignment {
  const schedule = parseBookingSchedule(
    data.date,
    data.time,
    data.durationHours,
  );
  const availabilityOpts = {
    weeklyBlocks,
    appointmentDateInput: schedule.appointmentDate,
  };
  const requested = data.requestedDetailer?.trim() ?? "";

  if (requested) {
    if (
      !isDetailerAvailable(
        requested,
        existing,
        schedule.startsAt,
        schedule.endsAt,
        availabilityOpts,
      )
    ) {
      return {
        ok: false,
        message: `${requested} is already booked for that time. Pick another time or detailer.`,
      };
    }
    return {
      ok: true,
      detailerName: requested,
      detailerAutoAssigned: false,
      schedule,
    };
  }

  const assigned = findAvailableDetailer(
    detailerNames,
    existing,
    schedule.startsAt,
    schedule.endsAt,
    availabilityOpts,
  );
  if (!assigned) {
    return {
      ok: false,
      message:
        "That time is fully booked. Please choose another time or call 833-536-6648.",
    };
  }

  return {
    ok: true,
    detailerName: assigned,
    detailerAutoAssigned: true,
    schedule,
  };
}

export function buildAvailabilitySnapshot(
  dateLabel: string,
  durationHours: number,
  timeSlots: readonly string[],
  detailerNames: readonly string[],
  existing: ExistingBookingWindow[],
  weeklyBlocks: StaffWeeklyBlock[] = [],
): DetailerAvailabilitySnapshot {
  const { appointmentDate } = parseBookingSchedule(
    dateLabel,
    timeSlots[0] ?? "8:00 AM",
    durationHours,
  );
  const availabilityOpts = {
    weeklyBlocks,
    appointmentDateInput: appointmentDate,
  };
  const busySlotsByDetailer: Record<string, string[]> = {};
  for (const name of detailerNames) {
    busySlotsByDetailer[name] = [];
  }

  const fullyBookedSlots: string[] = [];

  for (const slot of timeSlots) {
    const schedule = parseBookingSchedule(dateLabel, slot, durationHours);
    let anyFree = false;

    for (const detailer of detailerNames) {
      if (
        !isDetailerAvailable(
          detailer,
          existing,
          schedule.startsAt,
          schedule.endsAt,
          availabilityOpts,
        )
      ) {
        busySlotsByDetailer[detailer].push(slot);
      } else {
        anyFree = true;
      }
    }

    if (!anyFree) fullyBookedSlots.push(slot);
  }

  return { fullyBookedSlots, busySlotsByDetailer };
}
