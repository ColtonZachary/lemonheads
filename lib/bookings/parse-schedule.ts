/** Oklahoma service area — all appointment times are interpreted in this zone. */
export const BUSINESS_TIME_ZONE = "America/Chicago";

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

const DEFAULT_DURATION_HOURS = 2;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseDateLabel(dateLabel: string): {
  year: number;
  month: number;
  day: number;
} {
  const match = dateLabel
    .trim()
    .match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid date label: ${dateLabel}`);
  }

  const monthIndex = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === match[1].toLowerCase(),
  );
  if (monthIndex < 0) {
    throw new Error(`Invalid month in date label: ${dateLabel}`);
  }

  return {
    year: Number.parseInt(match[3], 10),
    month: monthIndex + 1,
    day: Number.parseInt(match[2], 10),
  };
}

function parseTimeLabel(timeLabel: string): { hour: number; minute: number } {
  const match = timeLabel
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    throw new Error(`Invalid time label: ${timeLabel}`);
  }

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

/** Wall-clock in BUSINESS_TIME_ZONE → UTC instant. */
export function localServiceTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  if (typeof Temporal !== "undefined") {
    const zdt = Temporal.ZonedDateTime.from(
      `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00[${BUSINESS_TIME_ZONE}]`,
    );
    return new Date(zdt.epochMilliseconds);
  }

  // Fallback: adjust UTC until Chicago-formatted parts match the intended local time.
  let ts = Date.UTC(year, month - 1, day, hour, minute, 0);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  for (let i = 0; i < 6; i++) {
    const parts = formatter.formatToParts(new Date(ts));
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      Number.parseInt(
        parts.find((p) => p.type === type)?.value ?? "0",
        10,
      );

    const cy = read("year");
    const cm = read("month");
    const cd = read("day");
    const ch = read("hour");
    const cmin = read("minute");

    const diffMs =
      Date.UTC(year, month - 1, day, hour, minute) -
      Date.UTC(cy, cm - 1, cd, ch, cmin);

    if (diffMs === 0) break;
    ts += diffMs;
  }

  return new Date(ts);
}

/** "May 21, 2026" + "2:00 PM" (Central) → UTC instants for Postgres. */
export function parseBookingSchedule(
  dateLabel: string,
  timeLabel: string,
  durationHours = DEFAULT_DURATION_HOURS,
): { appointmentDate: string; startsAt: string; endsAt: string } {
  const { year, month, day } = parseDateLabel(dateLabel);
  const { hour, minute } = parseTimeLabel(timeLabel);
  const start = localServiceTimeToUtc(year, month, day, hour, minute);

  const hours =
    Number.isFinite(durationHours) && durationHours > 0
      ? durationHours
      : DEFAULT_DURATION_HOURS;
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

  return {
    appointmentDate: `${year}-${pad2(month)}-${pad2(day)}`,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

/** Parse "$209" or "TBD" into cents when possible. */
export function parsePriceCents(estimatedTotal: string): number | null {
  const trimmed = estimatedTotal.trim();
  if (!trimmed || /^tbd$/i.test(trimmed)) return null;
  const digits = trimmed.replace(/[^0-9.]/g, "");
  const amount = Number.parseFloat(digits);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}
