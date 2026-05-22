import type { SupabaseClient } from "@supabase/supabase-js";

import { PACKAGES } from "@/lib/data";
import {
  addonPayCents,
  fetchDetailerPayRates,
  packagePayCents,
  type DetailerPayRatesSnapshot,
} from "@/lib/hub/detailer-pay-rates";
import { formatReportCents } from "@/lib/hub/reports-db";

export type PayBookingRow = {
  appointment_date: string;
  status: string;
  service_name: string;
  service_key: string | null;
  detailer_name: string | null;
  addons: string[];
  deleted_at: string | null;
};

export type DetailerPayAddonLine = {
  name: string;
  payCents: number;
};

export type DetailerPayJobLine = {
  appointmentDate: string;
  serviceName: string;
  packagePayCents: number;
  addonLines: DetailerPayAddonLine[];
  totalPayCents: number;
};

export type DetailerPayWeek = {
  weekStart: string;
  weekLabel: string;
  jobs: DetailerPayJobLine[];
  jobCount: number;
  packagePayCents: number;
  addonPayCents: number;
  totalPayCents: number;
};

export type DetailerPaySummary = {
  detailerName: string;
  isSenior: boolean;
  tierLabel: string;
  weeks: DetailerPayWeek[];
  jobCount: number;
  packagePayCents: number;
  addonPayCents: number;
  totalPayCents: number;
};

export type DetailerPayReport = {
  from: string;
  to: string;
  detailers: DetailerPaySummary[];
  grandTotalCents: number;
};

export function isCountedForDetailerPay(row: PayBookingRow): boolean {
  if (row.deleted_at || row.status === "cancelled") return false;
  const name = row.detailer_name?.trim();
  return Boolean(name && name.toLowerCase() !== "unassigned");
}

/** Monday (YYYY-MM-DD) for a calendar appointment_date. */
export function weekStartMonday(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map((x) => Number.parseInt(x, 10));
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dow = utc.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  utc.setUTCDate(utc.getUTCDate() + offset);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function weekLabel(weekStart: string): string {
  const end = addDays(weekStart, 6);
  return `Week of ${formatShortDate(weekStart)} – ${formatShortDate(end)}`;
}

function addDays(dateInput: string, delta: number): string {
  const [y, m, d] = dateInput.split("-").map((x) => Number.parseInt(x, 10));
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + delta);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatShortDate(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map((x) => Number.parseInt(x, 10));
  const utc = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(utc);
}

function resolvePackageKey(row: PayBookingRow): string | null {
  const key = row.service_key?.trim();
  if (key) return key;
  const name = row.service_name.trim().toLowerCase();
  const match = PACKAGES.find((p) => p.name.toLowerCase() === name);
  return match?.key ?? null;
}

export function calculateJobPay(
  row: PayBookingRow,
  isSenior: boolean,
  rates: DetailerPayRatesSnapshot,
): DetailerPayJobLine | null {
  if (!isCountedForDetailerPay(row)) return null;

  const packagePay = packagePayCents(rates, resolvePackageKey(row), isSenior);
  const addonLines: DetailerPayAddonLine[] = [];

  for (const addon of row.addons ?? []) {
    const pay = addonPayCents(rates, addon, isSenior);
    if (pay > 0) {
      addonLines.push({ name: addon.trim(), payCents: pay });
    }
  }

  const addonTotal = addonLines.reduce((s, a) => s + a.payCents, 0);

  return {
    appointmentDate: row.appointment_date,
    serviceName: row.service_name,
    packagePayCents: packagePay,
    addonLines,
    totalPayCents: packagePay + addonTotal,
  };
}

export function buildDetailerPayReport(
  rows: PayBookingRow[],
  from: string,
  to: string,
  seniorByDetailerName: Map<string, boolean>,
  rates: DetailerPayRatesSnapshot,
): DetailerPayReport {
  const jobsByDetailer = new Map<string, DetailerPayJobLine[]>();

  for (const row of rows) {
    const name = row.detailer_name?.trim();
    if (!name) continue;
    const job = calculateJobPay(row, seniorByDetailerName.get(name) ?? false, rates);
    if (!job) continue;
    const list = jobsByDetailer.get(name) ?? [];
    list.push(job);
    jobsByDetailer.set(name, list);
  }

  const detailers: DetailerPaySummary[] = [...jobsByDetailer.entries()]
    .map(([detailerName, jobs]) => {
      const isSenior = seniorByDetailerName.get(detailerName) ?? false;
      const weekMap = new Map<string, DetailerPayJobLine[]>();

      for (const job of jobs) {
        const ws = weekStartMonday(job.appointmentDate);
        const list = weekMap.get(ws) ?? [];
        list.push(job);
        weekMap.set(ws, list);
      }

      const weeks: DetailerPayWeek[] = [...weekMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekStart, weekJobs]) => {
          const sorted = [...weekJobs].sort((a, b) =>
            a.appointmentDate.localeCompare(b.appointmentDate),
          );
          let packagePayCents = 0;
          let addonPayCents = 0;
          for (const j of sorted) {
            packagePayCents += j.packagePayCents;
            addonPayCents += j.addonLines.reduce((s, a) => s + a.payCents, 0);
          }
          return {
            weekStart,
            weekLabel: weekLabel(weekStart),
            jobs: sorted,
            jobCount: sorted.length,
            packagePayCents,
            addonPayCents,
            totalPayCents: packagePayCents + addonPayCents,
          };
        });

      const packagePayCents = weeks.reduce((s, w) => s + w.packagePayCents, 0);
      const addonPayCents = weeks.reduce((s, w) => s + w.addonPayCents, 0);

      return {
        detailerName,
        isSenior,
        tierLabel: isSenior ? "Senior" : "Regular",
        weeks,
        jobCount: jobs.length,
        packagePayCents,
        addonPayCents,
        totalPayCents: packagePayCents + addonPayCents,
      };
    })
    .sort((a, b) => b.totalPayCents - a.totalPayCents);

  return {
    from,
    to,
    detailers,
    grandTotalCents: detailers.reduce((s, d) => s + d.totalPayCents, 0),
  };
}

export async function fetchDetailerSeniorMap(
  client: SupabaseClient,
): Promise<Map<string, boolean>> {
  const { data, error } = await client
    .from("staff_members")
    .select("display_name, is_senior_detailer")
    .eq("is_detailer", true);

  const map = new Map<string, boolean>();
  if (error) {
    console.error("[pay] staff senior map:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const name = (row.display_name as string)?.trim();
    if (name) map.set(name, Boolean(row.is_senior_detailer));
  }
  return map;
}

const PAY_BOOKING_SELECT =
  "appointment_date, status, service_name, service_key, detailer_name, addons, deleted_at";

export async function fetchPayBookingRows(
  client: SupabaseClient,
  from: string,
  to: string,
  options?: { detailerName?: string | null },
): Promise<PayBookingRow[]> {
  let query = client
    .from("bookings")
    .select(PAY_BOOKING_SELECT)
    .gte("appointment_date", from)
    .lte("appointment_date", to)
    .order("appointment_date", { ascending: true })
    .limit(3000);

  const name = options?.detailerName?.trim();
  if (name) {
    query = query.eq("detailer_name", name);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[pay] bookings fetch:", error.message);
    return [];
  }

  return (data ?? []) as PayBookingRow[];
}

export async function fetchDetailerPayReport(
  client: SupabaseClient,
  from: string,
  to: string,
  bookingRows?: PayBookingRow[],
  options?: { detailerName?: string | null },
): Promise<DetailerPayReport> {
  const rows =
    bookingRows ??
    (await fetchPayBookingRows(client, from, to, {
      detailerName: options?.detailerName,
    }));

  const [rates, seniorMap] = await Promise.all([
    fetchDetailerPayRates(client),
    options?.detailerName
      ? fetchSeniorFlagForDetailer(client, options.detailerName)
      : fetchDetailerSeniorMap(client),
  ]);

  let report = buildDetailerPayReport(rows, from, to, seniorMap, rates);

  if (options?.detailerName) {
    const key = options.detailerName.trim();
    const mine = report.detailers.filter((d) => d.detailerName === key);
    report = {
      ...report,
      detailers: mine,
      grandTotalCents: mine.reduce((s, d) => s + d.totalPayCents, 0),
    };
  }

  return report;
}

async function fetchSeniorFlagForDetailer(
  client: SupabaseClient,
  detailerName: string,
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  const { data } = await client
    .from("staff_members")
    .select("display_name, is_senior_detailer")
    .eq("display_name", detailerName)
    .maybeSingle();

  map.set(detailerName, Boolean(data?.is_senior_detailer));
  return map;
}

export { formatReportCents as formatPayCents };
