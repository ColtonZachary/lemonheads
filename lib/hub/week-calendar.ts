import {
  addDaysToDateInput,
  centralDateKey,
} from "@/lib/bookings/scheduling-limits";
import { BUSINESS_TIME_ZONE } from "@/lib/bookings/parse-schedule";

export const UNASSIGNED_DETAILER = "Unassigned";

export type WeekDayColumn = {
  dateKey: string;
  weekday: string;
  label: string;
};

export type WeekCalendarBooking = {
  id: string;
  reference_id: string;
  customer_name: string;
  service_name: string;
  detailer_name: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  city: string;
  billed_at: string | null;
  is_billed: boolean;
};

export type WeekCalendarDetailer = {
  name: string;
  color: string;
};

function centralWeekdayShort(dateInput: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "short",
  }).format(new Date(`${dateInput}T12:00:00`));
}

function centralMonthDay(dateInput: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateInput}T12:00:00`));
}

/** Monday (YYYY-MM-DD, Central) for the week containing dateInput. */
export function mondayOfWeekContaining(dateInput: string): string {
  let cur = dateInput;
  for (let i = 0; i < 7; i++) {
    if (centralWeekdayShort(cur) === "Mon") return cur;
    cur = addDaysToDateInput(cur, -1);
  }
  return dateInput;
}

export function parseWeekSearchParam(week: string | undefined): string {
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    return mondayOfWeekContaining(week);
  }
  return mondayOfWeekContaining(centralDateKey(new Date()));
}

export function buildWeekColumns(weekMonday: string): WeekDayColumn[] {
  const columns: WeekDayColumn[] = [];
  for (let i = 0; i < 7; i++) {
    const dateKey = addDaysToDateInput(weekMonday, i);
    columns.push({
      dateKey,
      weekday: centralWeekdayShort(dateKey),
      label: centralMonthDay(dateKey),
    });
  }
  return columns;
}

export function weekRangeLabel(weekMonday: string): string {
  const sunday = addDaysToDateInput(weekMonday, 6);
  return `${centralMonthDay(weekMonday)} – ${centralMonthDay(sunday)}`;
}

export function bookingDateKey(starts_at: string): string {
  return centralDateKey(starts_at);
}

export function detailerLaneKey(name: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : UNASSIGNED_DETAILER;
}

export function groupBookingsByDetailerAndDay(
  bookings: WeekCalendarBooking[],
  detailers: WeekCalendarDetailer[],
): Map<string, Map<string, WeekCalendarBooking[]>> {
  const lanes = new Map<string, Map<string, WeekCalendarBooking[]>>();
  for (const d of detailers) {
    lanes.set(d.name, new Map());
  }

  for (const b of bookings) {
    const lane = detailerLaneKey(b.detailer_name);
    if (!lanes.has(lane)) {
      lanes.set(lane, new Map());
    }
    const dayMap = lanes.get(lane)!;
    const day = bookingDateKey(b.starts_at);
    const list = dayMap.get(day) ?? [];
    list.push(b);
    dayMap.set(day, list);
  }

  for (const dayMap of lanes.values()) {
    for (const [day, list] of dayMap) {
      list.sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
      dayMap.set(day, list);
    }
  }

  return lanes;
}
