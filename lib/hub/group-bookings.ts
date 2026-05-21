import { centralDateKey } from "@/lib/bookings/scheduling-limits";
import { BUSINESS_TIME_ZONE } from "@/lib/bookings/parse-schedule";
import { formatCentralDate, formatCentralTime } from "@/lib/hub/format";

export type HubBookingListRow = {
  id: string;
  reference_id: string;
  customer_name: string;
  email: string;
  phone: string;
  service_name: string;
  detailer_name: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  final_price_cents: number | null;
  price_display: string;
  deleted_at: string | null;
};

export type HubDetailerGroup = {
  detailerKey: string;
  detailerLabel: string;
  bookings: HubBookingListRow[];
};

export type HubDateGroup = {
  dateKey: string;
  dateLabel: string;
  detailers: HubDetailerGroup[];
};

function detailerSortIndex(name: string, order: readonly string[]): number {
  const idx = order.indexOf(name);
  return idx >= 0 ? idx : order.length + 1;
}

export function groupBookingsByDateAndDetailer(
  rows: HubBookingListRow[],
  detailerOrder: readonly string[],
): HubDateGroup[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  const byDate = new Map<string, HubBookingListRow[]>();
  for (const row of sorted) {
    const key = centralDateKey(row.starts_at);
    const list = byDate.get(key) ?? [];
    list.push(row);
    byDate.set(key, list);
  }

  const dateKeys = [...byDate.keys()].sort();

  return dateKeys.map((dateKey) => {
    const dayRows = byDate.get(dateKey)!;
    const byDetailer = new Map<string, HubBookingListRow[]>();

    for (const row of dayRows) {
      const key = row.detailer_name?.trim() || "__unassigned__";
      const list = byDetailer.get(key) ?? [];
      list.push(row);
      byDetailer.set(key, list);
    }

    const detailerKeys = [...byDetailer.keys()].sort((a, b) => {
      const labelA = a === "__unassigned__" ? "zzz" : a;
      const labelB = b === "__unassigned__" ? "zzz" : b;
      return (
        detailerSortIndex(labelA, detailerOrder) -
        detailerSortIndex(labelB, detailerOrder)
      );
    });

    const sampleIso = dayRows[0]!.starts_at;
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIME_ZONE,
      weekday: "long",
    }).format(new Date(sampleIso));

    return {
      dateKey,
      dateLabel: `${weekday}, ${formatCentralDate(sampleIso)}`,
      detailers: detailerKeys.map((detailerKey) => ({
        detailerKey,
        detailerLabel:
          detailerKey === "__unassigned__"
            ? "Unassigned / auto"
            : detailerKey,
        bookings: byDetailer.get(detailerKey)!,
      })),
    };
  });
}

export function formatBookingPrice(row: HubBookingListRow): string {
  if (row.price_display) return row.price_display;
  if (row.final_price_cents != null) {
    return `$${(row.final_price_cents / 100).toFixed(0)}`;
  }
  return "—";
}

export function formatBookingTimeRange(row: HubBookingListRow): string {
  return `${formatCentralTime(row.starts_at)} – ${formatCentralTime(row.ends_at)}`;
}
