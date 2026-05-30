import { HubPageHeader } from "@/components/hub/hub-page";
import { ReportsDetailerPaySection } from "@/components/hub/reports-detailer-pay";
import { WeekNavLinks } from "@/components/hub/week-nav-links";
import { requireHubAccess } from "@/lib/auth/require-hub";
import {
  fetchDetailerPayReport,
  formatPayCents,
} from "@/lib/hub/detailer-pay-report";
import {
  parseWeekSearchParam,
  weekRangeLabel,
} from "@/lib/hub/week-calendar";
import { fetchDetailerNameForProfile } from "@/lib/hub/week-calendar-data";
import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubPayPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const access = await requireHubAccess();
  const supabase = await createSupabaseServerClient();
  const sp = await searchParams;
  const weekMonday = parseWeekSearchParam(sp.week);
  const weekSunday = addDaysToDateInput(weekMonday, 6);
  const weekLabel = weekRangeLabel(weekMonday);
  const weekPrevHref = `/hub/pay?week=${addDaysToDateInput(weekMonday, -7)}`;
  const weekNextHref = `/hub/pay?week=${addDaysToDateInput(weekMonday, 7)}`;

  let detailerName: string | null = null;
  if (!access.isManager) {
    detailerName = await fetchDetailerNameForProfile(
      supabase!,
      access.profile.id,
    );
  }

  if (!access.isManager && !detailerName) {
    return (
      <div className="max-w-2xl">
        <HubPageHeader title="My pay" />
        <p className="mt-6 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-4 text-sm text-amber-100/90">
          Your login is not linked to a staff profile yet. Ask a manager to connect
          your hub account under{" "}
          <span className="font-mono text-y">Staff</span> (profile link on your row).
        </p>
      </div>
    );
  }

  const pay = await fetchDetailerPayReport(
    supabase!,
    weekMonday,
    weekSunday,
    undefined,
    {
      detailerName: access.isManager ? null : detailerName,
    },
  );

  const mySummary = pay.detailers[0];

  return (
    <div className="max-w-4xl">
      <HubPageHeader
        title={access.isManager ? "Detailer pay" : "My pay"}
        description={
          access.isManager
            ? "Preview detailer earnings by calendar week. Full team breakdown also lives under Reports."
            : mySummary
              ? `${mySummary.tierLabel} detailer · ${mySummary.jobCount} job${mySummary.jobCount === 1 ? "" : "s"} this week`
              : "Earnings from completed jobs in the selected week."
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <WeekNavLinks
          weekLabel={weekLabel}
          prevHref={weekPrevHref}
          nextHref={weekNextHref}
        />
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40">
          Central Time · Mon–Sun
        </p>
      </div>

      {!access.isManager && mySummary ? (
        <div className="mt-4 rounded-lg border border-y/20 bg-y/5 px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/45">
            Week total
          </p>
          <p className="font-display text-3xl text-y">
            {formatPayCents(mySummary.totalPayCents)}
          </p>
        </div>
      ) : null}

      <ReportsDetailerPaySection pay={pay} singleDetailer={!access.isManager} />
    </div>
  );
}
