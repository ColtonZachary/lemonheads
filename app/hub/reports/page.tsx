import { ReportsHubPanel, ReportsPeriodForm } from "@/components/hub/reports-hub-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import {
  fetchHubReports,
  resolveReportDateRange,
} from "@/lib/hub/reports-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}) {
  await requireHubAccess({ managerOnly: true });
  const sp = await searchParams;
  const { from, to } = resolveReportDateRange(sp);
  const supabase = await createSupabaseServerClient();
  const report = await fetchHubReports(supabase!, from, to);

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

      <ReportsHubPanel report={report} />
    </div>
  );
}
