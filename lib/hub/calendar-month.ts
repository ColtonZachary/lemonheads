import {
  dateInputFromParts,
  getCentralTodayDateInput,
  isSameDayCutoffActive,
} from "@/lib/bookings/scheduling-limits";

export const HUB_CALENDAR_MONTHS = [
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

export type CalendarDayCell = {
  day: number | null;
  dateInput: string | null;
  disabled: boolean;
  isToday: boolean;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateInput(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

export function parseDateInput(value: string): { y: number; m: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = Number.parseInt(match[1], 10);
  const m = Number.parseInt(match[2], 10) - 1;
  if (m < 0 || m > 11) return null;
  return { y, m };
}

export function formatDateInputLabel(dateInput: string): string {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return dateInput;
  const day = Number.parseInt(dateInput.slice(8, 10), 10);
  return `${HUB_CALENDAR_MONTHS[parsed.m]} ${day}, ${parsed.y}`;
}

export function buildCalendarMonth(
  year: number,
  monthIndex: number,
  options: { disablePast?: boolean } = {},
): CalendarDayCell[] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: CalendarDayCell[] = [];
  const todayKey = getCentralTodayDateInput();

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null, dateInput: null, disabled: true, isToday: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateInput = dateInputFromParts(year, monthIndex, day);
    const isToday = dateInput === todayKey;
    const past = options.disablePast ? dateInput < todayKey : false;
    const todayCutoff = Boolean(
      options.disablePast && isToday && isSameDayCutoffActive(),
    );
    cells.push({
      day,
      dateInput,
      disabled: past || todayCutoff,
      isToday,
    });
  }

  return cells;
}
