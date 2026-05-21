import type { SupabaseClient } from "@supabase/supabase-js";

import {
  hasOpenDayOverride,
  type StaffDateOverride,
} from "@/lib/bookings/date-overrides";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  BUSINESS_TIME_ZONE,
  parseBookingSchedule,
} from "@/lib/bookings/parse-schedule";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type StaffWeeklyBlock = {
  id: string;
  staff_member_id: string;
  day_of_week: number;
  all_day: boolean;
  reason: string;
  staff_members: { display_name: string } | null;
};

/** Central weekday index 0=Sun … 6=Sat for YYYY-MM-DD. */
export function centralWeekdayIndex(dateInput: string): number {
  const dateLabel = dateInputToLabel(dateInput);
  const { startsAt } = parseBookingSchedule(
    dateLabel,
    BOOKING_TIME_SLOTS[0],
    0.25,
  );
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "long",
  }).format(new Date(startsAt));
  return WEEKDAY_LABELS.indexOf(name as (typeof WEEKDAY_LABELS)[number]);
}

export function weeklyBlocksForDetailer(
  detailerName: string,
  blocks: StaffWeeklyBlock[],
): StaffWeeklyBlock[] {
  return blocks.filter(
    (b) =>
      b.staff_members?.display_name === detailerName ||
      b.staff_members?.display_name?.trim() === detailerName.trim(),
  );
}

export function isDetailerBlockedByWeeklyRule(
  detailerName: string,
  dateInput: string,
  weeklyBlocks: StaffWeeklyBlock[],
  openDayOverrides: StaffDateOverride[] = [],
): boolean {
  if (hasOpenDayOverride(detailerName, dateInput, openDayOverrides)) {
    return false;
  }
  const dow = centralWeekdayIndex(dateInput);
  if (dow < 0) return false;
  return weeklyBlocksForDetailer(detailerName, weeklyBlocks).some(
    (b) => b.day_of_week === dow && b.all_day,
  );
}

export async function fetchActiveWeeklyBlocks(
  client: SupabaseClient,
): Promise<StaffWeeklyBlock[]> {
  const { data, error } = await client
    .from("staff_weekly_blocks")
    .select(
      "id, staff_member_id, day_of_week, all_day, reason, staff_members(display_name)",
    )
    .eq("active", true);

  if (error) {
    console.error("[weekly-blocks] fetch failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    staff_member_id: row.staff_member_id,
    day_of_week: row.day_of_week,
    all_day: row.all_day,
    reason: row.reason,
    staff_members: Array.isArray(row.staff_members)
      ? (row.staff_members[0] ?? null)
      : row.staff_members,
  })) as StaffWeeklyBlock[];
}
