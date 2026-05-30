import { ReportsDashboard } from "@/components/hub/reports-hub-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchDetailerPayReport } from "@/lib/hub/detailer-pay-report";
import { fetchWebsiteFeedbackForHub } from "@/lib/feedback/website-feedback";
import {
  buildReportsPageHref,
  fetchHubReports,
  resolveReportDateRange,
} from "@/lib/hub/reports-db";
import {
  buildSiteUsageSnapshot,
  fetchSitePageViewsForHub,
} from "@/lib/analytics/site-page-views";
import { buildWebsitePerformanceSnapshot } from "@/lib/hub/website-performance-stats";
import {
  parseWeekSearchParam,
  weekRangeLabel,
} from "@/lib/hub/week-calendar";
import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Align server cache with client auto-refresh interval (5 min). */
export const revalidate = 300;

export default async function HubReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    preset?: string;
    payWeek?: string;
    tab?: string;
  }>;
}) {
  await requireHubAccess({ managerOnly: true });
  const sp = await searchParams;
  const { from, to } = resolveReportDateRange(sp);
  const payWeekMonday = parseWeekSearchParam(sp.payWeek);
  const payWeekSunday = addDaysToDateInput(payWeekMonday, 6);
  const payWeekLabel = weekRangeLabel(payWeekMonday);
  const periodQuery = { from: sp.from, to: sp.to, preset: sp.preset };
  const payWeekPrevHref = buildReportsPageHref({
    ...periodQuery,
    payWeek: addDaysToDateInput(payWeekMonday, -7),
  });
  const payWeekNextHref = buildReportsPageHref({
    ...periodQuery,
    payWeek: addDaysToDateInput(payWeekMonday, 7),
  });

  const supabase = await createSupabaseServerClient();
  const [report, detailerPay, feedbackRows, pageViews] = await Promise.all([
    fetchHubReports(supabase!, from, to),
    fetchDetailerPayReport(supabase!, payWeekMonday, payWeekSunday),
    fetchWebsiteFeedbackForHub(supabase!),
    fetchSitePageViewsForHub(supabase!, from, to),
  ]);

  const usage = buildSiteUsageSnapshot(pageViews, from, to);
  const sitePerformance = buildWebsitePerformanceSnapshot(
    feedbackRows,
    from,
    to,
    usage,
  );

  const initialTab = sp.tab === "stats" ? "stats" : "overview";

  return (
    <ReportsDashboard
      from={from}
      to={to}
      preset={sp.preset}
      report={report}
      detailerPay={detailerPay}
      payWeekLabel={payWeekLabel}
      payWeekPrevHref={payWeekPrevHref}
      payWeekNextHref={payWeekNextHref}
      initialTab={initialTab}
      sitePerformance={sitePerformance}
    />
  );
}
