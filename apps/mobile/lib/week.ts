/** Shift a YYYY-MM-DD date by N days (UTC calendar math). */
export function addDaysToDateInput(dateInput: string, days: number): string {
  const [y, m, d] = dateInput.split("-").map((x) => Number.parseInt(x, 10));
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function mondayOfWeekContaining(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map((x) => Number.parseInt(x, 10));
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dow = utc.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDaysToDateInput(dateInput, offset);
}

function todayCentralDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

export function currentWeekMonday(): string {
  return mondayOfWeekContaining(todayCentralDateKey());
}

export function shiftWeekMonday(weekMonday: string, weeks: number): string {
  return addDaysToDateInput(weekMonday, weeks * 7);
}
