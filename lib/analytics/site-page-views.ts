import type { SupabaseClient } from "@supabase/supabase-js";

import {
  addDaysToDateInput,
  centralDateKey,
} from "@/lib/bookings/scheduling-limits";
import { priorSitePerformancePeriod } from "@/lib/hub/website-performance-stats";

export type SitePageViewRow = {
  id: string;
  page_path: string;
  viewed_at: string;
};

export type SiteUsageDailyPoint = {
  date: string;
  label: string;
  pageViews: number;
  /** Views of /book (booking funnel) */
  bookViews: number;
};

export type SiteUsageTotals = {
  pageViews: number;
  bookViews: number;
  uniquePaths: number;
};

export type SiteUsageComparison = {
  priorFrom: string;
  priorTo: string;
  current: SiteUsageTotals;
  prior: SiteUsageTotals;
};

export type SiteUsageSnapshot = {
  from: string;
  to: string;
  dailySeries: SiteUsageDailyPoint[];
  comparison: SiteUsageComparison;
  topPages: { path: string; views: number }[];
};

const PUBLIC_PATH_PREFIX = /^\/(?!hub|api|auth)/;

export function normalizeSitePagePath(path: string): string | null {
  const trimmed = path.trim().slice(0, 500);
  if (!trimmed.startsWith("/")) return null;
  if (!PUBLIC_PATH_PREFIX.test(trimmed)) return null;
  const withoutQuery = trimmed.split("?")[0]!.split("#")[0]!;
  return withoutQuery || "/";
}

export function isBookPagePath(path: string): boolean {
  return path === "/book" || path.startsWith("/book/");
}

function formatDailyChartLabel(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function enumerateCentralDates(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDaysToDateInput(cur, 1);
    if (out.length > 400) break;
  }
  return out;
}

function filterViewsByCentralDates(
  rows: SitePageViewRow[],
  from: string,
  to: string,
): SitePageViewRow[] {
  return rows.filter((r) => {
    const d = centralDateKey(r.viewed_at);
    return d >= from && d <= to;
  });
}

export function summarizeSiteUsage(rows: SitePageViewRow[]): SiteUsageTotals {
  if (!rows.length) {
    return { pageViews: 0, bookViews: 0, uniquePaths: 0 };
  }

  const paths = new Set<string>();
  let bookViews = 0;

  for (const r of rows) {
    paths.add(r.page_path);
    if (isBookPagePath(r.page_path)) bookViews += 1;
  }

  return {
    pageViews: rows.length,
    bookViews,
    uniquePaths: paths.size,
  };
}

export function buildSiteUsageSnapshot(
  allRows: SitePageViewRow[],
  from: string,
  to: string,
): SiteUsageSnapshot {
  const currentRows = filterViewsByCentralDates(allRows, from, to);
  const prior = priorSitePerformancePeriod(from, to);
  const priorRows = filterViewsByCentralDates(allRows, prior.from, prior.to);

  const dailyByDate = new Map<
    string,
    { pageViews: number; bookViews: number }
  >();
  for (const date of enumerateCentralDates(from, to)) {
    dailyByDate.set(date, { pageViews: 0, bookViews: 0 });
  }

  const pathCounts = new Map<string, number>();

  for (const row of currentRows) {
    const date = centralDateKey(row.viewed_at);
    const day = dailyByDate.get(date);
    if (day) {
      day.pageViews += 1;
      if (isBookPagePath(row.page_path)) day.bookViews += 1;
    }
    pathCounts.set(row.page_path, (pathCounts.get(row.page_path) ?? 0) + 1);
  }

  const dailySeries: SiteUsageDailyPoint[] = enumerateCentralDates(from, to).map(
    (date) => {
      const day = dailyByDate.get(date)!;
      return {
        date,
        label: formatDailyChartLabel(date),
        pageViews: day.pageViews,
        bookViews: day.bookViews,
      };
    },
  );

  const topPages = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, views]) => ({ path, views }));

  return {
    from,
    to,
    dailySeries,
    comparison: {
      priorFrom: prior.from,
      priorTo: prior.to,
      current: summarizeSiteUsage(currentRows),
      prior: summarizeSiteUsage(priorRows),
    },
    topPages,
  };
}

export async function fetchSitePageViewsForHub(
  client: SupabaseClient,
  from: string,
  to: string,
): Promise<SitePageViewRow[]> {
  const prior = priorSitePerformancePeriod(from, to);
  const wideStart = addDaysToDateInput(prior.from, -1);

  const { data, error } = await client
    .from("site_page_views")
    .select("id, page_path, viewed_at")
    .gte("viewed_at", `${wideStart}T00:00:00.000Z`)
    .lte("viewed_at", `${addDaysToDateInput(to, 1)}T23:59:59.999Z`)
    .order("viewed_at", { ascending: true })
    .limit(50_000);

  if (error) {
    console.error("[site-page-views] hub fetch:", error.message);
    return [];
  }

  return (data ?? []) as SitePageViewRow[];
}
