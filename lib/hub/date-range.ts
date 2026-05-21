const MAX_RANGE_DAYS = 120;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Add calendar days to a YYYY-MM-DD string. */
export function addDaysToDateInput(dateInput: string, days: number): string {
  const [y, m, d] = dateInput.split("-").map((x) => Number.parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/** Inclusive list of YYYY-MM-DD from start through end. */
export function dateInputsInRange(
  startInput: string,
  endInput: string,
): { dates: string[] } | { error: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startInput) || !/^\d{4}-\d{2}-\d{2}$/.test(endInput)) {
    return { error: "Invalid date range." };
  }
  if (endInput < startInput) {
    return { error: "End date must be on or after the start date." };
  }

  const dates: string[] = [];
  let cur = startInput;
  while (cur <= endInput) {
    dates.push(cur);
    if (dates.length > MAX_RANGE_DAYS) {
      return {
        error: `Date range cannot exceed ${MAX_RANGE_DAYS} days. Split into smaller ranges.`,
      };
    }
    if (cur === endInput) break;
    cur = addDaysToDateInput(cur, 1);
  }

  return { dates };
}
