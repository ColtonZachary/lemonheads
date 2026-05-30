import { BUSINESS_TIME_ZONE } from "@/lib/bookings/parse-schedule";
import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import type { SiteUsageSnapshot } from "@/lib/analytics/site-page-views";
import type { WebsiteFeedbackRow } from "@/lib/feedback/website-feedback";

export type SitePerformanceDailyPoint = {
  date: string;
  label: string;
  submissions: number;
  /** Average 1–5 rating for submissions that day; 0 if none */
  avgRating: number;
};

export type SitePerformanceTotals = {
  submissions: number;
  avgRating: number;
  pending: number;
  handled: number;
};

export type SitePerformanceComparison = {
  priorFrom: string;
  priorTo: string;
  current: SitePerformanceTotals;
  prior: SitePerformanceTotals;
};

export type WebsitePerformanceSnapshot = {
  from: string;
  to: string;
  dailySeries: SitePerformanceDailyPoint[];
  comparison: SitePerformanceComparison;
  usage: SiteUsageSnapshot;
};

function centralDateFromIso(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
  });
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

export function priorSitePerformancePeriod(
  from: string,
  to: string,
): { from: string; to: string } {
  const days = enumerateCentralDates(from, to).length;
  const priorTo = addDaysToDateInput(from, -1);
  const priorFrom = addDaysToDateInput(priorTo, -(days - 1));
  return { from: priorFrom, to: priorTo };
}

function filterFeedbackByCentralDates(
  rows: WebsiteFeedbackRow[],
  from: string,
  to: string,
): WebsiteFeedbackRow[] {
  return rows.filter((r) => {
    const d = centralDateFromIso(r.created_at);
    return d >= from && d <= to;
  });
}

export function summarizeSitePerformance(
  rows: WebsiteFeedbackRow[],
): SitePerformanceTotals {
  if (!rows.length) {
    return { submissions: 0, avgRating: 0, pending: 0, handled: 0 };
  }

  let ratingSum = 0;
  let pending = 0;
  let handled = 0;

  for (const r of rows) {
    ratingSum += r.rating;
    if (r.status === "pending") pending += 1;
    else handled += 1;
  }

  return {
    submissions: rows.length,
    avgRating: Math.round((ratingSum / rows.length) * 10) / 10,
    pending,
    handled,
  };
}

export function sitePercentChange(
  current: number,
  prior: number,
): number | null {
  if (prior === 0) {
    if (current === 0) return 0;
    return null;
  }
  return ((current - prior) / prior) * 100;
}

export function formatSitePercentChange(pct: number | null): string {
  if (pct === null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** Rating change in points (not percent) when comparing averages. */
export function siteRatingPointChange(
  current: number,
  prior: number,
): number | null {
  if (prior === 0 && current === 0) return 0;
  if (prior === 0) return null;
  return Math.round((current - prior) * 10) / 10;
}

export function formatSiteRatingChange(points: number | null): string {
  if (points === null) return "—";
  const sign = points > 0 ? "+" : "";
  return `${sign}${points.toFixed(1)}`;
}

export function formatSiteAvgRating(rating: number): string {
  if (rating <= 0) return "—";
  return `${rating.toFixed(1)} / 5`;
}

export function buildWebsitePerformanceSnapshot(
  allRows: WebsiteFeedbackRow[],
  from: string,
  to: string,
  usage: SiteUsageSnapshot,
): WebsitePerformanceSnapshot {
  const currentRows = filterFeedbackByCentralDates(allRows, from, to);
  const prior = priorSitePerformancePeriod(from, to);
  const priorRows = filterFeedbackByCentralDates(
    allRows,
    prior.from,
    prior.to,
  );

  const dailyByDate = new Map<
    string,
    { submissions: number; ratingSum: number }
  >();
  for (const date of enumerateCentralDates(from, to)) {
    dailyByDate.set(date, { submissions: 0, ratingSum: 0 });
  }

  for (const row of currentRows) {
    const date = centralDateFromIso(row.created_at);
    const day = dailyByDate.get(date);
    if (!day) continue;
    day.submissions += 1;
    day.ratingSum += row.rating;
  }

  const dailySeries: SitePerformanceDailyPoint[] = enumerateCentralDates(
    from,
    to,
  ).map((date) => {
    const day = dailyByDate.get(date)!;
    return {
      date,
      label: formatDailyChartLabel(date),
      submissions: day.submissions,
      avgRating:
        day.submissions > 0
          ? Math.round((day.ratingSum / day.submissions) * 10) / 10
          : 0,
    };
  });

  return {
    from,
    to,
    dailySeries,
    comparison: {
      priorFrom: prior.from,
      priorTo: prior.to,
      current: summarizeSitePerformance(currentRows),
      prior: summarizeSitePerformance(priorRows),
    },
    usage,
  };
}
