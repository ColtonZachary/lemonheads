import { WeekCalendar } from "@/components/hub/week-calendar";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import { parseWeekSearchParam } from "@/lib/hub/week-calendar";
import {
  fetchDetailerNameForProfile,
  fetchWeekCalendarData,
} from "@/lib/hub/week-calendar-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const access = await requireHubAccess();
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const weekMonday = parseWeekSearchParam(params.week);

  let detailerFilter: string | null = null;
  if (!access.isManager) {
    detailerFilter = await fetchDetailerNameForProfile(
      supabase!,
      access.profile.id,
    );
  }

  const data = await fetchWeekCalendarData(supabase!, weekMonday, {
    detailerFilter,
  });

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">CALENDAR</h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        {access.isManager
          ? "Week at a glance by detailer. Billed jobs show in green — click a job to open it, or use Mark billed on the card."
          : "Your schedule for the week. Billed jobs show in green."}
      </p>

      <div className="mt-10">
        <WeekCalendar
          weekMonday={data.weekMonday}
          weekLabel={data.weekLabel}
          days={data.days}
          detailers={data.detailers}
          bookings={data.bookings}
          canManage={access.isManager}
        />
      </div>

      <p className="mt-6 font-mono text-[10px] text-text/30">
        Showing {data.bookings.length} job
        {data.bookings.length === 1 ? "" : "s"} ·{" "}
        {addDaysToDateInput(weekMonday, 0)} through{" "}
        {addDaysToDateInput(weekMonday, 6)}
      </p>
    </div>
  );
}
