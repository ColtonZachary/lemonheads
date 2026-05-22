import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizePhoneDigits,
  phoneFlexibleIlikePattern,
  searchCustomerProfiles,
} from "@/lib/hub/customer-search";

export type CustomerBookingPick = {
  /** Set when matched from `customers` table. */
  customerId: string | null;
  displayName: string;
  email: string;
  phone: string;
  bookingCount: number;
};

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function pickKey(email: string, phone: string): string {
  const e = email.trim().toLowerCase();
  if (e) return `e:${e}`;
  const digits = normalizePhoneDigits(phone);
  if (digits.length >= 4) return `p:${digits}`;
  return `n:${email}|${phone}`;
}

function addPick(
  map: Map<string, CustomerBookingPick>,
  pick: CustomerBookingPick,
): void {
  const key = pickKey(pick.email, pick.phone);
  const existing = map.get(key);
  if (!existing || pick.bookingCount > existing.bookingCount) {
    map.set(key, pick);
  }
}

async function searchCustomersTable(
  client: SupabaseClient,
  query: string,
): Promise<CustomerBookingPick[]> {
  const trimmed = query.trim();
  const pattern = `%${escapeIlike(trimmed)}%`;
  const digits = normalizePhoneDigits(trimmed);
  const isEmail = trimmed.includes("@");

  let request = client
    .from("customers")
    .select("id, display_name, email, phone, booking_count")
    .order("last_booking_at", { ascending: false, nullsFirst: false })
    .limit(15);

  if (isEmail) {
    request = request.ilike("email", pattern);
  } else if (digits.length >= 4 && digits.length >= trimmed.replace(/\D/g, "").length) {
    const phonePat = phoneFlexibleIlikePattern(digits);
    if (phonePat) {
      request = request.or(
        `phone.ilike.${phonePat},display_name.ilike.${pattern},email.ilike.${pattern}`,
      );
    } else {
      request = request.or(
        `display_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`,
      );
    }
  } else {
    request = request.or(
      `display_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`,
    );
  }

  const { data, error } = await request;
  if (error) {
    console.error("[customers] booking lookup:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    customerId: row.id as string,
    displayName: (row.display_name as string) || "Customer",
    email: (row.email as string) ?? "",
    phone: (row.phone as string) ?? "",
    bookingCount: (row.booking_count as number) ?? 0,
  }));
}

async function searchBookingsByName(
  client: SupabaseClient,
  query: string,
): Promise<CustomerBookingPick[]> {
  const pattern = `%${escapeIlike(query.trim())}%`;
  const { data, error } = await client
    .from("bookings")
    .select("customer_name, email, phone")
    .ilike("customer_name", pattern)
    .order("starts_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("[customers] booking name lookup:", error.message);
    return [];
  }

  const map = new Map<string, CustomerBookingPick>();
  for (const row of data ?? []) {
    const email = String(row.email ?? "").trim();
    const phone = String(row.phone ?? "").trim();
    if (!email && normalizePhoneDigits(phone).length < 4) continue;
    addPick(map, {
      customerId: null,
      displayName: String(row.customer_name ?? "").trim() || "Customer",
      email,
      phone,
      bookingCount: 0,
    });
  }
  return [...map.values()].slice(0, 12);
}

/** Search existing customers for hub booking autofill (managers). */
export async function searchCustomersForBooking(
  client: SupabaseClient,
  query: string,
): Promise<CustomerBookingPick[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const map = new Map<string, CustomerBookingPick>();

  const fromTable = await searchCustomersTable(client, trimmed);
  for (const pick of fromTable) addPick(map, pick);

  const looksLikeName =
    !trimmed.includes("@") &&
    normalizePhoneDigits(trimmed).length < trimmed.replace(/\D/g, "").length;

  if (looksLikeName || map.size < 6) {
    const byName = await searchBookingsByName(client, trimmed);
    for (const pick of byName) addPick(map, pick);
  }

  if (trimmed.length >= 3 && map.size < 10) {
    const profiles = await searchCustomerProfiles(client, trimmed);
    for (const p of profiles) {
      addPick(map, {
        customerId: null,
        displayName: p.displayName,
        email: p.email,
        phone: p.phone,
        bookingCount: p.bookingCount,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 12);
}
