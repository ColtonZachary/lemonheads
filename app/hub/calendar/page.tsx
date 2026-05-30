import { Suspense } from "react";

import { CalendarPageClient } from "@/components/hub/calendar-page-client";
import { HubPageHeader } from "@/components/hub/hub-page";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { parseWeekSearchParam } from "@/lib/hub/week-calendar";
import {
  fetchDetailerNameForProfile,
  fetchWeekCalendarData,
} from "@/lib/hub/week-calendar-data";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function CalendarFallback() {
  return (
    <p className="mt-10 font-mono text-xs text-muted-foreground">Loading calendar…</p>
  );
}

async function CalendarContent({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; book?: string }>;
}) {
  const access = await requireHubAccess();
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const weekMonday = parseWeekSearchParam(params.week);
  const canBook = access.isManager;

  let detailerFilter: string | null = null;
  if (!access.isManager) {
    detailerFilter = await fetchDetailerNameForProfile(
      supabase!,
      access.profile.id,
    );
  }

  const [data, detailerNames] = await Promise.all([
    fetchWeekCalendarData(supabase!, weekMonday, { detailerFilter }),
    canBook ? fetchBookableDetailerNames(supabase!) : Promise.resolve([]),
  ]);

  return (
    <div>
      <HubPageHeader
        title="Calendar"
        description={
          access.isManager
            ? "Week at a glance by detailer. Open New booking to add a job without leaving the calendar."
            : "Your schedule for the week. Billed jobs show in green."
        }
      />

      <CalendarPageClient
        weekMonday={data.weekMonday}
        weekLabel={data.weekLabel}
        days={data.days}
        detailers={data.detailers}
        bookings={data.bookings}
        bookingCount={data.bookings.length}
        canManage={access.isManager}
        canBook={canBook}
        detailerNames={detailerNames}
        initialBookOpen={params.book === "1"}
        clearBookQueryParam={params.book === "1"}
      />
    </div>
  );
}

export default function HubCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; book?: string }>;
}) {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarContent searchParams={searchParams} />
    </Suspense>
  );
}
