import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import { parseWeekSearchParam, weekRangeLabel } from "@/lib/hub/week-calendar";
import {
  EMPLOYEE_JOB_LIST_SELECT,
  serializeEmployeeJobList,
} from "@/lib/mobile/employee-booking";
import { isEmployeeApiError, requireEmployeeApi } from "@/lib/mobile/require-employee-api";

export async function GET(request: Request) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  const weekParam = new URL(request.url).searchParams.get("week") ?? undefined;
  const weekMonday = parseWeekSearchParam(weekParam);
  const weekEnd = addDaysToDateInput(weekMonday, 6);

  const { data, error } = await ctx.supabase
    .from("bookings")
    .select(EMPLOYEE_JOB_LIST_SELECT)
    .is("deleted_at", null)
    .gte("appointment_date", weekMonday)
    .lte("appointment_date", weekEnd)
    .neq("status", "cancelled")
    .eq("detailer_name", ctx.detailerName)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[mobile employee jobs]", error.message);
    return Response.json({ error: "Could not load jobs" }, { status: 500 });
  }

  return Response.json({
    weekMonday,
    weekEnd,
    weekLabel: weekRangeLabel(weekMonday),
    detailerName: ctx.detailerName,
    jobs: (data ?? []).map((row) => serializeEmployeeJobList(row)),
  });
}
