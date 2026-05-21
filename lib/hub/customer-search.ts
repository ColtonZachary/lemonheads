import type { SupabaseClient } from "@supabase/supabase-js";

import { formatHubPriceCents } from "@/lib/hub/booking-price-display";

export type CustomerBookingRow = {
  id: string;
  reference_id: string;
  customer_name: string;
  email: string;
  phone: string;
  service_name: string;
  detailer_name: string | null;
  starts_at: string;
  status: string;
  estimated_price_cents: number | null;
  discount_cents: number | null;
  final_price_cents: number | null;
  price_display: string;
  deleted_at: string | null;
};

export type CustomerProfile = {
  email: string;
  displayName: string;
  phone: string;
  /** Normalized digits for phone-based lookup links. */
  phoneDigits: string;
  bookingCount: number;
  firstBookingAt: string | null;
  lastBookingAt: string | null;
  totalSpentCents: number;
  bookings: CustomerBookingRow[];
};

const BOOKING_SELECT =
  "id, reference_id, customer_name, email, phone, service_name, detailer_name, starts_at, status, estimated_price_cents, discount_cents, final_price_cents, price_display, deleted_at";

const MIN_PHONE_DIGITS = 4;

export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

/** Match formatted phones: (405) 555-1234, 405.555.1234, etc. */
export function phoneFlexibleIlikePattern(digits: string): string {
  if (digits.length < MIN_PHONE_DIGITS) return "";
  const parts = digits.split("").map((d) => escapeIlike(d));
  return `%${parts.join("%")}%`;
}

function rowPhoneDigits(row: CustomerBookingRow): string {
  return normalizePhoneDigits(row.phone);
}

function buildProfile(
  bookings: CustomerBookingRow[],
  groupBy: "email" | "phone",
): CustomerProfile | null {
  if (!bookings.length) return null;

  const sorted = [...bookings].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
  );
  const latest = sorted[0]!;
  let totalSpentCents = 0;
  for (const b of sorted) {
    if (b.deleted_at) continue;
    totalSpentCents += b.final_price_cents ?? 0;
  }
  const active = sorted.filter((b) => !b.deleted_at);
  const times = active.map((b) => new Date(b.starts_at).getTime());

  const phoneDigits = rowPhoneDigits(latest);
  const email =
    groupBy === "email"
      ? latest.email.trim().toLowerCase()
      : sorted.find((b) => b.email.trim())?.email.trim().toLowerCase() ?? "";

  return {
    email,
    displayName: latest.customer_name,
    phone: latest.phone,
    phoneDigits,
    bookingCount: active.length,
    firstBookingAt:
      times.length > 0 ? new Date(Math.min(...times)).toISOString() : null,
    lastBookingAt:
      times.length > 0 ? new Date(Math.max(...times)).toISOString() : null,
    totalSpentCents,
    bookings: sorted,
  };
}

function groupIntoProfiles(
  rows: CustomerBookingRow[],
  groupBy: "email" | "phone",
): CustomerProfile[] {
  const groups = new Map<string, CustomerBookingRow[]>();

  for (const row of rows) {
    let key: string;
    if (groupBy === "email") {
      key = row.email.trim().toLowerCase();
      if (!key) continue;
    } else {
      key = rowPhoneDigits(row);
      if (key.length < MIN_PHONE_DIGITS) continue;
    }
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  return [...groups.values()]
    .map((bookings) => buildProfile(bookings, groupBy))
    .filter((p): p is CustomerProfile => p !== null)
    .sort((a, b) => {
      const aT = a.lastBookingAt ? new Date(a.lastBookingAt).getTime() : 0;
      const bT = b.lastBookingAt ? new Date(b.lastBookingAt).getTime() : 0;
      return bT - aT;
    });
}

function bookingMatchesPhoneDigits(
  row: CustomerBookingRow,
  digits: string,
): boolean {
  const rowDigits = rowPhoneDigits(row);
  if (!rowDigits) return false;
  return rowDigits === digits || rowDigits.endsWith(digits);
}

export function customerProfileHref(profile: CustomerProfile): string {
  if (profile.email) {
    return `/hub/customers?email=${encodeURIComponent(profile.email)}`;
  }
  return `/hub/customers?phone=${encodeURIComponent(profile.phoneDigits)}`;
}

export async function searchCustomerProfiles(
  client: SupabaseClient,
  query: string,
): Promise<CustomerProfile[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const isEmail = trimmed.includes("@");
  let request = client
    .from("bookings")
    .select(BOOKING_SELECT)
    .order("starts_at", { ascending: false })
    .limit(150);

  if (isEmail) {
    request = request.ilike("email", `%${escapeIlike(trimmed)}%`);
  } else {
    const digits = normalizePhoneDigits(trimmed);
    const pattern = phoneFlexibleIlikePattern(digits);
    if (!pattern) return [];
    request = request.ilike("phone", pattern);
  }

  const { data, error } = await request;
  if (error) {
    console.error("[customers] search:", error.message);
    return [];
  }

  const groupBy = isEmail ? "email" : "phone";
  let profiles = groupIntoProfiles((data ?? []) as CustomerBookingRow[], groupBy);

  if (!isEmail) {
    const digits = normalizePhoneDigits(trimmed);
    profiles = profiles.filter(
      (p) =>
        p.phoneDigits === digits ||
        p.phoneDigits.endsWith(digits) ||
        digits.endsWith(p.phoneDigits),
    );
  }

  return profiles;
}

export async function fetchCustomerProfileByEmail(
  client: SupabaseClient,
  email: string,
): Promise<CustomerProfile | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await client
    .from("bookings")
    .select(BOOKING_SELECT)
    .ilike("email", normalized)
    .order("starts_at", { ascending: false })
    .limit(150);

  if (error) {
    console.error("[customers] by email:", error.message);
    return null;
  }

  const profiles = groupIntoProfiles((data ?? []) as CustomerBookingRow[], "email");
  return profiles.find((p) => p.email === normalized) ?? profiles[0] ?? null;
}

export async function fetchCustomerProfileByPhone(
  client: SupabaseClient,
  phoneQuery: string,
): Promise<CustomerProfile | null> {
  const digits = normalizePhoneDigits(phoneQuery);
  if (digits.length < MIN_PHONE_DIGITS) return null;

  const pattern = phoneFlexibleIlikePattern(digits);
  const { data, error } = await client
    .from("bookings")
    .select(BOOKING_SELECT)
    .ilike("phone", pattern)
    .order("starts_at", { ascending: false })
    .limit(150);

  if (error) {
    console.error("[customers] by phone:", error.message);
    return null;
  }

  const rows = ((data ?? []) as CustomerBookingRow[]).filter((row) =>
    bookingMatchesPhoneDigits(row, digits),
  );
  if (!rows.length) return null;

  return buildProfile(rows, "phone");
}

export function formatCustomerTotalSpent(cents: number): string {
  return formatHubPriceCents(cents);
}
