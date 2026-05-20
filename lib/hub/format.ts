import { BUSINESS_TIME_ZONE } from "@/lib/bookings/parse-schedule";

const centralDateTime = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const centralTime = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const centralDate = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Display a UTC instant in Central Time (hub UI). */
export function formatCentralDateTime(iso: string): string {
  return centralDateTime.format(new Date(iso));
}

export function formatCentralTime(iso: string): string {
  return centralTime.format(new Date(iso));
}

export function formatCentralDate(iso: string): string {
  return centralDate.format(new Date(iso));
}
