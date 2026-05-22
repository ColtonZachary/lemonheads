import { ReportsHubPanel, ReportsPeriodForm } from "@/components/hub/reports-hub-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchDetailerPayReport } from "@/lib/hub/detailer-pay-report";
import {
  buildReportsPageHref,
  fetchHubReports,
  resolveReportDateRange,
} from "@/lib/hub/reports-db";
import {
  parseWeekSearchParam,
  weekRangeLabel,
} from "@/lib/hub/week-calendar";
import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    preset?: string;
    payWeek?: string;
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
  const [report, detailerPay] = await Promise.all([
    fetchHubReports(supabase!, from, to),
    fetchDetailerPayReport(supabase!, payWeekMonday, payWeekSunday),
  ]);

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">REPORTS</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        Revenue, detailer hours, packages, add-ons, and cities · Central dates
      </p>

      <ReportsPeriodForm
        from={from}
        to={to}
        preset={sp.preset}
      />

      <ReportsHubPanel
        report={report}
        detailerPay={detailerPay}
        payWeekLabel={payWeekLabel}
        payWeekPrevHref={payWeekPrevHref}
        payWeekNextHref={payWeekNextHref}
      />
    </div>
  );
}
