import { parseBookingSchedule } from "@/lib/bookings/parse-schedule";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";

export function blockWindowFromForm(
  dateInput: string,
  startTimeLabel: string,
  endTimeLabel: string,
): { startsAt: string; endsAt: string } | { error: string } {
  try {
    const dateLabel = dateInputToLabel(dateInput);
    const start = parseBookingSchedule(dateLabel, startTimeLabel, 0.25);
    const end = parseBookingSchedule(dateLabel, endTimeLabel, 0.25);

    if (new Date(end.startsAt).getTime() <= new Date(start.startsAt).getTime()) {
      return { error: "End time must be after start time." };
    }

    return { startsAt: start.startsAt, endsAt: end.startsAt };
  } catch {
    return { error: "Invalid date or time." };
  }
}
