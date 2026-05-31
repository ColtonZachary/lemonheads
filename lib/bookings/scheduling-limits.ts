import type { LocationSchedulingContext } from "@/lib/bookings/location-scheduling";
import {
  isDateAllowedForLocation,
  isTimeSlotAllowedForLocation,
  validateLocationScheduleFromInput,
} from "@/lib/bookings/location-scheduling";
import { BOOKING_TIME_SLOTS, type BookingTimeSlot } from "@/lib/bookings/constants";
import {
  BUSINESS_TIME_ZONE,
  parseBookingSchedule,
} from "@/lib/bookings/parse-schedule";
import type { SchedulingRulesSnapshot } from "@/lib/bookings/scheduling-rules";
import { isDateInputBlackout } from "@/lib/bookings/scheduling-rules";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";

/** Default when hub rule is missing (matches migration seed). */
export const SAME_DAY_CUTOFF_HOUR = 16;

function cutoffHour(rules?: SchedulingRulesSnapshot): number {
  return rules?.sameDayCutoffHour ?? SAME_DAY_CUTOFF_HOUR;
}

function sameDayCutoffEnabled(rules?: SchedulingRulesSnapshot): boolean {
  return rules?.sameDayCutoffEnabled !== false;
}

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

/** YYYY-MM-DD in America/Chicago for the given instant. */
export function centralDateKey(instant: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof instant === "string" ? new Date(instant) : instant);
}

export function getCentralTodayDateInput(): string {
  return centralDateKey(new Date());
}

/** Shift a Central calendar date (YYYY-MM-DD) by N days. */
export function addDaysToDateInput(dateInput: string, deltaDays: number): string {
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateInput;
  const probe = new Date(`${dateInput}T12:00:00`);
  probe.setDate(probe.getDate() + deltaDays);
  return centralDateKey(probe);
}

export function dateLabelFromParts(
  year: number,
  monthIndex: number,
  day: number,
): string {
  return `${MONTH_NAMES[monthIndex]} ${day}, ${year}`;
}

export function dateInputFromParts(
  year: number,
  monthIndex: number,
  day: number,
): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function centralHourNow(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return Number.parseInt(
    parts.find((p) => p.type === "hour")?.value ?? "0",
    10,
  );
}

export function isSameDayCutoffActive(
  rules?: SchedulingRulesSnapshot,
): boolean {
  if (!sameDayCutoffEnabled(rules)) return false;
  return centralHourNow() >= cutoffHour(rules);
}

function dateInputFromLabel(dateLabel: string): string | null {
  try {
    return parseBookingSchedule(dateLabel, BOOKING_TIME_SLOTS[0], 0.25)
      .appointmentDate;
  } catch {
    return null;
  }
}

function isBlackoutDateLabel(
  dateLabel: string,
  rules?: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
): boolean {
  if (!rules) return false;
  const dateInput = dateInputFromLabel(dateLabel);
  if (!dateInput) return false;
  return isDateInputBlackout(dateInput, rules, serviceAreaSlugs);
}

export function isPastDateInput(dateInput: string): boolean {
  return dateInput < getCentralTodayDateInput();
}

export function isTodayDateInput(dateInput: string): boolean {
  return dateInput === getCentralTodayDateInput();
}

export function isPastDateLabel(dateLabel: string): boolean {
  try {
    const { appointmentDate } = parseBookingSchedule(
      dateLabel,
      BOOKING_TIME_SLOTS[0],
      0.25,
    );
    return isPastDateInput(appointmentDate);
  } catch {
    return true;
  }
}

export function isTodayDateLabel(dateLabel: string): boolean {
  try {
    const { appointmentDate } = parseBookingSchedule(
      dateLabel,
      BOOKING_TIME_SLOTS[0],
      0.25,
    );
    return isTodayDateInput(appointmentDate);
  } catch {
    return false;
  }
}

/** Slot start instant (UTC) for a Central wall-clock time. */
export function slotStartsAtIso(
  dateLabel: string,
  timeSlot: string,
): string | null {
  try {
    return parseBookingSchedule(dateLabel, timeSlot, 0.25).startsAt;
  } catch {
    return null;
  }
}

export function isTimeSlotInPast(dateLabel: string, timeSlot: string): boolean {
  const startsAt = slotStartsAtIso(dateLabel, timeSlot);
  if (!startsAt) return true;
  return new Date(startsAt).getTime() <= Date.now();
}

export function isDateLabelSelectable(
  dateLabel: string,
  rules?: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
  locationContext?: LocationSchedulingContext | null,
): boolean {
  if (isBlackoutDateLabel(dateLabel, rules, serviceAreaSlugs)) return false;
  if (isPastDateLabel(dateLabel)) return false;
  if (isTodayDateLabel(dateLabel) && isSameDayCutoffActive(rules)) return false;
  try {
    const { appointmentDate } = parseBookingSchedule(
      dateLabel,
      BOOKING_TIME_SLOTS[0],
      0.25,
    );
    if (!isDateAllowedForLocation(appointmentDate, locationContext)) return false;
  } catch {
    return false;
  }
  return true;
}

export function isTimeSlotSelectable(
  dateLabel: string,
  timeSlot: string,
  rules?: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
  locationContext?: LocationSchedulingContext | null,
): boolean {
  if (!isDateLabelSelectable(dateLabel, rules, serviceAreaSlugs, locationContext)) {
    return false;
  }
  if (isTimeSlotInPast(dateLabel, timeSlot)) return false;
  if (!isTimeSlotAllowedForLocation(timeSlot, locationContext)) return false;
  return true;
}

export function isTimeSlotSelectableForDateInput(
  dateInput: string,
  timeSlot: string,
): boolean {
  try {
    return isTimeSlotSelectable(dateInputToLabel(dateInput), timeSlot);
  } catch {
    return false;
  }
}

function formatCutoffMessage(hour: number): string {
  const h = hour % 24;
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

export function validateBookingSchedule(
  dateLabel: string,
  timeSlot: string,
  rules?: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
  locationContext?: LocationSchedulingContext | null,
): string | null {
  if (isBlackoutDateLabel(dateLabel, rules, serviceAreaSlugs)) {
    return "We are closed that day. Please pick another date.";
  }
  if (!isDateLabelSelectable(dateLabel, rules, serviceAreaSlugs, locationContext)) {
    if (isPastDateLabel(dateLabel)) {
      return "That date has already passed. Please pick a future date.";
    }
    try {
      const { appointmentDate } = parseBookingSchedule(
        dateLabel,
        BOOKING_TIME_SLOTS[0],
        0.25,
      );
      if (!isDateAllowedForLocation(appointmentDate, locationContext)) {
        return "This location requires booking at least the next day. Please pick a future date.";
      }
    } catch {
      /* fall through */
    }
    const cutoff = cutoffHour(rules);
    return `Same-day bookings are unavailable after ${formatCutoffMessage(cutoff)} Central. Pick a future date.`;
  }
  if (!isTimeSlotSelectable(dateLabel, timeSlot, rules, serviceAreaSlugs, locationContext)) {
    if (isTimeSlotInPast(dateLabel, timeSlot)) {
      return "That time has already passed. Please pick a later time or another day.";
    }
  if (!isTimeSlotAllowedForLocation(timeSlot, locationContext)) {
    if (locationContext?.isEnid) {
      return "Enid bookings start at 8:30 AM. Please pick a later time.";
    }
    return "Earliest available time for this location is 8:30 AM.";
  }
    return "That time is not available. Please pick another slot.";
  }
  return null;
}

export function validateBookingScheduleFromInput(
  dateInput: string,
  timeSlot: string,
  rules?: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
  locationContext?: LocationSchedulingContext | null,
): string | null {
  try {
    return validateBookingSchedule(
      dateInputToLabel(dateInput),
      timeSlot,
      rules,
      serviceAreaSlugs,
      locationContext,
    );
  } catch {
    return "Invalid date or time.";
  }
}

/** Allow keeping an existing past slot when managers only edit other fields. */
export function validateScheduleChangeFromInput(
  dateInput: string,
  timeSlot: string,
  existingStartsAt: string | null | undefined,
  rules?: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
): string | null {
  try {
    const label = dateInputToLabel(dateInput);
    const { startsAt } = parseBookingSchedule(label, timeSlot, 0.25);
    if (existingStartsAt && startsAt === existingStartsAt) {
      return null;
    }
  } catch {
    return "Invalid date or time.";
  }
  return validateBookingScheduleFromInput(
    dateInput,
    timeSlot,
    rules,
    serviceAreaSlugs,
  );
}

export function validateBlockScheduleFromInput(
  dateInput: string,
  startTime: string,
  endTime: string,
): string | null {
  const startErr = validateBookingScheduleFromInput(dateInput, startTime);
  if (startErr) return startErr;

  const endErr = validateBookingScheduleFromInput(dateInput, endTime);
  if (endErr) return "End time must be in the future.";

  try {
    const dateLabel = dateInputToLabel(dateInput);
    const start = parseBookingSchedule(dateLabel, startTime, 0.25).startsAt;
    const end = parseBookingSchedule(dateLabel, endTime, 0.25).startsAt;
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      return "End time must be after start time.";
    }
  } catch {
    return "Invalid date or time.";
  }

  return null;
}

export function listTimeSlotStates(
  dateLabel: string | null,
  rules?: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
  locationContext?: LocationSchedulingContext | null,
) {
  if (!dateLabel) {
    return BOOKING_TIME_SLOTS.map((slot) => ({
      slot,
      selectable: false,
      reason: "past" as const,
    }));
  }

  return BOOKING_TIME_SLOTS.map((slot) => {
    const selectable = isTimeSlotSelectable(
      dateLabel,
      slot,
      rules,
      serviceAreaSlugs,
      locationContext,
    );
    let reason: "past" | "cutoff" | "ok" = "ok";
    if (!selectable) {
      if (!isDateLabelSelectable(dateLabel, rules, serviceAreaSlugs, locationContext)) {
        reason = "cutoff";
      } else if (isTimeSlotInPast(dateLabel, slot)) reason = "past";
      else reason = "cutoff";
    }
    return { slot, selectable, reason };
  });
}

export type { BookingTimeSlot };

export function listBookableDateLabels(
  rules: SchedulingRulesSnapshot,
  serviceAreaSlugs: string[] = [],
  locationContext?: LocationSchedulingContext | null,
  maxCount = 45,
  maxScan = 120,
): { dateInput: string; label: string }[] {
  const results: { dateInput: string; label: string }[] = [];
  let dateInput = getCentralTodayDateInput();
  let scanned = 0;

  while (results.length < maxCount && scanned < maxScan) {
    const label = dateInputToLabel(dateInput);
    if (isDateLabelSelectable(label, rules, serviceAreaSlugs, locationContext)) {
      results.push({ dateInput, label });
    }
    dateInput = addDaysToDateInput(dateInput, 1);
    scanned += 1;
  }

  return results;
}
