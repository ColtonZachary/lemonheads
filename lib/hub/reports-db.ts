import type { SupabaseClient } from "@supabase/supabase-js";

import { formatHubPriceCents } from "@/lib/hub/booking-price-display";
import type { CatalogAddonRow } from "@/lib/hub/catalog-db";
import { fetchCatalogAddons } from "@/lib/hub/catalog-db";
import {
  addDaysToDateInput,
  getCentralTodayDateInput,
} from "@/lib/bookings/scheduling-limits";

export type ReportBookingRow = {
  appointment_date: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service_name: string;
  service_key: string | null;
  detailer_name: string | null;
  city: string;
  addons: string[];
  estimated_price_cents: number | null;
  discount_cents: number | null;
  final_price_cents: number | null;
  price_override_cents: number | null;
  deleted_at: string | null;
};

export type ReportBreakdownRow = {
  label: string;
  count: number;
  revenueCents: number;
  hours: number;
};

export type HubReportsSnapshot = {
  from: string;
  to: string;
  summary: {
    totalJobs: number;
    countedJobs: number;
    cancelledJobs: number;
    revenueCents: number;
    discountCents: number;
    scheduledHours: number;
    avgJobCents: number;
  };
  byPackage: ReportBreakdownRow[];
  byAddon: ReportBreakdownRow[];
  byDetailer: ReportBreakdownRow[];
  byCity: ReportBreakdownRow[];
};

const BOOKING_SELECT =
  "appointment_date, starts_at, ends_at, status, service_name, service_key, detailer_name, city, addons, estimated_price_cents, discount_cents, final_price_cents, price_override_cents, deleted_at";

export type ReportCatalog = {
  addons: CatalogAddonRow[];
};

/** Catalog list price for one add-on on a billable job ($50 × job count). */
export function addonRevenueCents(
  addonName: string,
  row: ReportBookingRow,
  catalog: ReportCatalog,
): number {
  if (!isCountedForRevenue(row)) return 0;

  const addon = catalog.addons.find((a) => a.name === addonName.trim());
  return addon?.price_cents ?? 0;
}

function bumpAddonBreakdown(
  map: Map<string, ReportBreakdownRow>,
  addonName: string,
  row: ReportBookingRow,
  catalog: ReportCatalog,
) {
  const key = addonName.trim();
  if (!key) return;

  const existing = map.get(key) ?? {
    label: key,
    count: 0,
    revenueCents: 0,
    hours: 0,
  };

  if (isCountedForRevenue(row)) {
    existing.count += 1;
    existing.revenueCents += addonRevenueCents(key, row, catalog);
  }

  map.set(key, existing);
}

function isCountedForRevenue(row: ReportBookingRow): boolean {
  return !row.deleted_at && row.status !== "cancelled";
}

export function bookingRevenueCents(row: ReportBookingRow): number {
  if (!isCountedForRevenue(row)) return 0;
  return (
    row.price_override_cents ??
    row.final_price_cents ??
    row.estimated_price_cents ??
    0
  );
}

export function bookingScheduledHours(row: ReportBookingRow): number {
  if (row.deleted_at || row.status === "cancelled") return 0;
  const ms =
    new Date(row.ends_at).getTime() - new Date(row.starts_at).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms / (1000 * 60 * 60);
}

export function resolveReportDateRange(sp: {
  from?: string;
  to?: string;
  preset?: string;
}): { from: string; to: string } {
  const today = getCentralTodayDateInput();
  const valid = (d?: string) => d?.match(/^\d{4}-\d{2}-\d{2}$/);

  if (sp.preset === "last30") {
    return { from: addDaysToDateInput(today, -29), to: today };
  }

  if (sp.preset === "lastMonth") {
    const firstThisMonth = `${today.slice(0, 7)}-01`;
    const lastPrev = addDaysToDateInput(firstThisMonth, -1);
    const from = `${lastPrev.slice(0, 7)}-01`;
    return { from, to: lastPrev };
  }

  const from = valid(sp.from) ? sp.from! : `${today.slice(0, 7)}-01`;
  const to = valid(sp.to) ? sp.to! : today;
  if (from > to) return { from: to, to: from };
  return { from, to };
}

function bumpBreakdown(
  map: Map<string, ReportBreakdownRow>,
  label: string,
  row: ReportBookingRow,
) {
  const key = label.trim() || "—";
  const existing = map.get(key) ?? {
    label: key,
    count: 0,
    revenueCents: 0,
    hours: 0,
  };
  if (isCountedForRevenue(row)) {
    existing.count += 1;
    existing.revenueCents += bookingRevenueCents(row);
    existing.hours += bookingScheduledHours(row);
  }
  map.set(key, existing);
}

function sortBreakdown(rows: ReportBreakdownRow[]): ReportBreakdownRow[] {
  return [...rows].sort((a, b) => {
    if (b.revenueCents !== a.revenueCents) return b.revenueCents - a.revenueCents;
    return b.count - a.count;
  });
}

export function buildReportsSnapshot(
  rows: ReportBookingRow[],
  from: string,
  to: string,
  catalog: ReportCatalog,
): HubReportsSnapshot {
  const active = rows.filter((r) => !r.deleted_at);
  const counted = active.filter(isCountedForRevenue);
  const cancelledJobs = active.filter((r) => r.status === "cancelled").length;

  let revenueCents = 0;
  let discountCents = 0;
  let scheduledHours = 0;
  for (const row of counted) {
    revenueCents += bookingRevenueCents(row);
    discountCents += row.discount_cents ?? 0;
    scheduledHours += bookingScheduledHours(row);
  }

  const byPackage = new Map<string, ReportBreakdownRow>();
  const byAddon = new Map<string, ReportBreakdownRow>();
  const byDetailer = new Map<string, ReportBreakdownRow>();
  const byCity = new Map<string, ReportBreakdownRow>();

  for (const row of active) {
    bumpBreakdown(byPackage, row.service_name, row);
    bumpBreakdown(byDetailer, row.detailer_name ?? "Unassigned", row);
    bumpBreakdown(byCity, row.city.trim() || "Unknown", row);

    for (const addon of row.addons ?? []) {
      bumpAddonBreakdown(byAddon, addon, row, catalog);
    }
  }

  return {
    from,
    to,
    summary: {
      totalJobs: active.length,
      countedJobs: counted.length,
      cancelledJobs,
      revenueCents,
      discountCents,
      scheduledHours,
      avgJobCents:
        counted.length > 0 ? Math.round(revenueCents / counted.length) : 0,
    },
    byPackage: sortBreakdown([...byPackage.values()]),
    byAddon: sortBreakdown([...byAddon.values()]),
    byDetailer: sortBreakdown([...byDetailer.values()]),
    byCity: sortBreakdown([...byCity.values()]),
  };
}

export async function fetchHubReports(
  client: SupabaseClient,
  from: string,
  to: string,
): Promise<HubReportsSnapshot> {
  const [bookingsResult, addons] = await Promise.all([
    client
      .from("bookings")
      .select(BOOKING_SELECT)
      .gte("appointment_date", from)
      .lte("appointment_date", to)
      .order("appointment_date", { ascending: true })
      .limit(3000),
    fetchCatalogAddons(client),
  ]);

  const catalog: ReportCatalog = { addons };

  if (bookingsResult.error) {
    console.error("[reports] fetch:", bookingsResult.error.message);
    return buildReportsSnapshot([], from, to, catalog);
  }

  return buildReportsSnapshot(
    (bookingsResult.data ?? []) as ReportBookingRow[],
    from,
    to,
    catalog,
  );
}

export function formatReportCents(cents: number): string {
  return formatHubPriceCents(cents);
}

export function formatReportHours(hours: number): string {
  if (hours < 0.05) return "0h";
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}
