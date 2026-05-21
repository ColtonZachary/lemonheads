import Link from "next/link";

import {
  BookingsAvailabilityForm,
  BookingsDayAvailabilityMatrix,
  DURATION_OPTIONS,
} from "@/components/hub/bookings-day-availability";
import { BookingsGroupedList } from "@/components/hub/bookings-grouped-list";
import { Button } from "@/components/ui/button";
import { getDetailerAvailability } from "@/lib/booking-availability";
import {
  addDaysToDateInput,
  getCentralTodayDateInput,
} from "@/lib/bookings/scheduling-limits";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { requireHubAccess } from "@/lib/auth/require-hub";
import {
  groupBookingsByDateAndDetailer,
  type HubBookingListRow,
} from "@/lib/hub/group-bookings";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseDuration(raw: string | undefined): number {
  const n = Number.parseFloat(raw ?? "");
  if (!Number.isFinite(n) || n <= 0) return 2.5;
  return (DURATION_OPTIONS as readonly number[]).includes(n) ? n : 2.5;
}

export default async function HubBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; duration?: string }>;
}) {
  await requireHubAccess({ managerOnly: true });
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  const viewDate =
    sp.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? sp.date : getCentralTodayDateInput();
  const durationHours = parseDuration(sp.duration);
  const dateLabel = dateInputToLabel(viewDate);

  const [detailerOrder, availability] = await Promise.all([
    fetchBookableDetailerNames(supabase!),
    getDetailerAvailability(dateLabel, durationHours),
  ]);

  const today = getCentralTodayDateInput();
  const listFrom = addDaysToDateInput(today, -14);
  const listTo = addDaysToDateInput(today, 60);

  const { data: bookings } = await supabase!
    .from("bookings")
    .select(
      "id, reference_id, customer_name, email, phone, service_name, detailer_name, starts_at, ends_at, status, estimated_price_cents, discount_cents, final_price_cents, price_display, deleted_at",
    )
    .gte("appointment_date", listFrom)
    .lte("appointment_date", listTo)
    .order("starts_at", { ascending: true })
    .limit(500);

  const rows = (bookings ?? []) as HubBookingListRow[];
  const groups = groupBookingsByDateAndDetailer(rows, detailerOrder);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-[0.04em] text-y">BOOKINGS</h1>
          <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
            Check slots for any day above · scroll the list below by date · Central
            Time
          </p>
        </div>
        <Button asChild>
          <Link href="/hub/bookings/new">+ New booking</Link>
        </Button>
      </div>

      <div className="mt-10">
        <BookingsAvailabilityForm
          viewDate={viewDate}
          durationHours={durationHours}
        />
        <BookingsDayAvailabilityMatrix
          viewDate={viewDate}
          dateLabel={dateLabel}
          durationHours={durationHours}
          detailerNames={detailerOrder}
          availability={availability}
        />
      </div>

      <section className="mt-12">
        <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Scheduled jobs · {listFrom} through {listTo}
        </p>
        <BookingsGroupedList groups={groups} highlightDate={viewDate} />
      </section>
    </div>
  );
}
