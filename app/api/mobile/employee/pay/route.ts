import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import {
  fetchDetailerPayReport,
  formatPayCents,
} from "@/lib/hub/detailer-pay-report";
import { isEmployeeApiError, requireEmployeeApi } from "@/lib/mobile/require-employee-api";
import { parseWeekSearchParam, weekRangeLabel } from "@/lib/hub/week-calendar";

export async function GET(request: Request) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  const weekParam = new URL(request.url).searchParams.get("week") ?? undefined;
  const weekMonday = parseWeekSearchParam(weekParam);
  const weekEnd = addDaysToDateInput(weekMonday, 6);

  const report = await fetchDetailerPayReport(ctx.supabase, weekMonday, weekEnd, undefined, {
    detailerName: ctx.detailerName,
  });

  const summary = report.detailers[0] ?? null;
  const week =
    summary?.weeks.find((w) => w.weekStart === weekMonday) ?? summary?.weeks[0] ?? null;

  return Response.json({
    weekMonday,
    weekEnd,
    weekLabel: weekRangeLabel(weekMonday),
    detailerName: ctx.detailerName,
    tierLabel: summary?.tierLabel ?? "Regular",
    isSenior: summary?.isSenior ?? false,
    week: week
      ? {
          jobCount: week.jobCount,
          packagePayCents: week.packagePayCents,
          addonPayCents: week.addonPayCents,
          totalPayCents: week.totalPayCents,
          totalPayDisplay: formatPayCents(week.totalPayCents),
          jobs: week.jobs.map((job) => ({
            appointmentDate: job.appointmentDate,
            serviceName: job.serviceName,
            totalPayCents: job.totalPayCents,
            totalPayDisplay: formatPayCents(job.totalPayCents),
          })),
        }
      : {
          jobCount: 0,
          packagePayCents: 0,
          addonPayCents: 0,
          totalPayCents: 0,
          totalPayDisplay: formatPayCents(0),
          jobs: [],
        },
  });
}
