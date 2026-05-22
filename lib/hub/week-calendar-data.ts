import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveDetailerColor } from "@/lib/hub/detailer-colors";
import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import {
  buildWeekColumns,
  detailerLaneKey,
  UNASSIGNED_DETAILER,
  type WeekCalendarBooking,
  type WeekCalendarDetailer,
  weekRangeLabel,
} from "@/lib/hub/week-calendar";

export type WeekCalendarData = {
  weekMonday: string;
  weekLabel: string;
  days: ReturnType<typeof buildWeekColumns>;
  detailers: WeekCalendarDetailer[];
  bookings: WeekCalendarBooking[];
};

function isMissingBilledColumn(error: { message?: string; code?: string }): boolean {
  return (
    error.code === "42703" ||
    (error.message?.includes("billed_at") ?? false)
  );
}

export async function fetchWeekCalendarData(
  client: SupabaseClient,
  weekMonday: string,
  options: { detailerFilter?: string | null } = {},
): Promise<WeekCalendarData> {
  const weekEnd = addDaysToDateInput(weekMonday, 6);
  const days = buildWeekColumns(weekMonday);

  const { data: staffRows } = await client
    .from("staff_members")
    .select("display_name, calendar_color, sort_order, is_detailer, is_bookable, active")
    .eq("active", true)
    .eq("is_bookable", true)
    .eq("is_detailer", true)
    .order("sort_order");

  let bookingQuery = client
    .from("bookings")
    .select(
      "id, reference_id, customer_name, service_name, detailer_name, starts_at, ends_at, status, city, billed_at",
    )
    .is("deleted_at", null)
    .gte("appointment_date", weekMonday)
    .lte("appointment_date", weekEnd)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  if (options.detailerFilter) {
    bookingQuery = bookingQuery.eq("detailer_name", options.detailerFilter);
  }

  const { data: bookingRows, error: bookingError } = await bookingQuery;

  const billedColumnMissing =
    bookingError != null && isMissingBilledColumn(bookingError);

  let rows = bookingRows ?? [];
  if (billedColumnMissing) {
    const { data: fallback } = await client
      .from("bookings")
      .select(
        "id, reference_id, customer_name, service_name, detailer_name, starts_at, ends_at, status, city",
      )
      .is("deleted_at", null)
      .gte("appointment_date", weekMonday)
      .lte("appointment_date", weekEnd)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });
    rows = (fallback ?? []).map((r) => ({ ...r, billed_at: null }));
  } else if (bookingError) {
    console.error("[week-calendar] bookings:", bookingError.message);
    rows = [];
  }

  const bookingIds = rows.map((r) => r.id);
  const paidBookingIds = new Set<string>();

  if (bookingIds.length > 0) {
    const { data: invoices } = await client
      .from("invoices")
      .select("booking_id, status")
      .in("booking_id", bookingIds)
      .eq("status", "paid");

    for (const inv of invoices ?? []) {
      paidBookingIds.add(inv.booking_id);
    }
  }

  const bookings: WeekCalendarBooking[] = rows.map((r) => ({
    id: r.id,
    reference_id: r.reference_id,
    customer_name: r.customer_name,
    service_name: r.service_name,
    detailer_name: r.detailer_name,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    status: r.status,
    city: r.city ?? "",
    billed_at: r.billed_at ?? null,
    is_billed: Boolean(r.billed_at) || paidBookingIds.has(r.id),
  }));

  const detailerNames = new Set<string>();
  for (const s of staffRows ?? []) {
    if (s.display_name) detailerNames.add(s.display_name);
  }
  for (const b of bookings) {
    const key = detailerLaneKey(b.detailer_name);
    if (key !== UNASSIGNED_DETAILER) detailerNames.add(key);
  }

  const sortedNames = [...detailerNames].sort((a, b) => a.localeCompare(b));
  const staffByName = new Map(
    (staffRows ?? []).map((s, i) => [s.display_name, { ...s, index: i }]),
  );

  const detailers: WeekCalendarDetailer[] = sortedNames.map((name, index) => {
    const staff = staffByName.get(name);
    return {
      name,
      color: resolveDetailerColor(
        name,
        staff?.sort_order ?? index,
        staff?.calendar_color,
      ),
    };
  });

  if (
    !options.detailerFilter &&
    bookings.some((b) => detailerLaneKey(b.detailer_name) === UNASSIGNED_DETAILER)
  ) {
    detailers.push({
      name: UNASSIGNED_DETAILER,
      color: "#6b7280",
    });
  }

  return {
    weekMonday,
    weekLabel: weekRangeLabel(weekMonday),
    days,
    detailers,
    bookings,
  };
}

export async function fetchDetailerNameForProfile(
  client: SupabaseClient,
  profileId: string,
): Promise<string | null> {
  const { data } = await client
    .from("staff_members")
    .select("display_name")
    .eq("profile_id", profileId)
    .eq("active", true)
    .maybeSingle();

  return data?.display_name ?? null;
}
