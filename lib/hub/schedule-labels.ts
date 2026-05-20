import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  BUSINESS_TIME_ZONE,
  parseBookingSchedule,
} from "@/lib/bookings/parse-schedule";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function centralParts(iso: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const parts = formatter.formatToParts(new Date(iso));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: Number.parseInt(read("year"), 10),
    month: Number.parseInt(read("month"), 10),
    day: Number.parseInt(read("day"), 10),
    hour: read("hour"),
    minute: read("minute"),
    dayPeriod: read("dayPeriod").toUpperCase(),
  };
}

/** Labels used by the public booking flow + hub edit form. */
export function centralScheduleLabels(iso: string): {
  dateLabel: string;
  timeLabel: string;
  dateInput: string;
} {
  const p = centralParts(iso);
  const dateLabel = `${MONTH_NAMES[p.month - 1]} ${p.day}, ${p.year}`;
  const minute = p.minute.padStart(2, "0");
  const timeLabel = `${p.hour}:${minute} ${p.dayPeriod}`;

  const matched =
    BOOKING_TIME_SLOTS.find((slot) => slot === timeLabel) ??
    BOOKING_TIME_SLOTS.find((slot) => {
      try {
        const { startsAt } = parseBookingSchedule(dateLabel, slot, 1);
        return Math.abs(new Date(startsAt).getTime() - new Date(iso).getTime()) < 60_000;
      } catch {
        return false;
      }
    }) ??
    BOOKING_TIME_SLOTS[0];

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const dateInput = `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;

  return { dateLabel, timeLabel: matched, dateInput };
}

export function dateInputToLabel(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map((x) => Number.parseInt(x, 10));
  if (!y || !m || !d) throw new Error("Invalid date");
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export function bookingDurationHours(startsAt: string, endsAt: string): number {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  const hours = ms / (60 * 60 * 1000);
  return Number.isFinite(hours) && hours > 0 ? hours : 2;
}
