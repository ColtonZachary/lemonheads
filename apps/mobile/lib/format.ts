const TZ = "America/Chicago";

export function formatTimeRange(startsAt: string, endsAt: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  };
  const start = new Intl.DateTimeFormat("en-US", opts).format(new Date(startsAt));
  const end = new Intl.DateTimeFormat("en-US", opts).format(new Date(endsAt));
  return `${start} – ${end}`;
}

export function formatDuration(startsAt: string, endsAt: string): string {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (ms <= 0) return "";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatWeekdayLong(dateInput: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
  }).format(new Date(`${dateInput}T12:00:00`));
}

export function formatMonthDay(dateInput: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateInput}T12:00:00`));
}

export function formatJobDateLong(dateInput: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateInput}T12:00:00`));
}

export function formatWeekdayShort(dateInput: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(new Date(`${dateInput}T12:00:00`));
}

export function centralTodayDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function statusTone(
  status: string,
): "done" | "active" | "pending" | "cancelled" {
  if (status === "completed") return "done";
  if (status === "in_progress" || status === "confirmed") return "active";
  if (status === "cancelled") return "cancelled";
  return "pending";
}
