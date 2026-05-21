import Link from "next/link";

import { BookingsGroupedList } from "@/components/hub/bookings-grouped-list";
import { Button } from "@/components/ui/button";
import { requireHubAccess } from "@/lib/auth/require-hub";
import {
  groupBookingsByDateAndDetailer,
  type HubBookingListRow,
} from "@/lib/hub/group-bookings";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubBookingsPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const detailerOrder = await fetchBookableDetailerNames(supabase!);

  const { data: bookings } = await supabase!
    .from("bookings")
    .select(
      "id, reference_id, customer_name, email, phone, service_name, detailer_name, starts_at, ends_at, status, final_price_cents, price_display, deleted_at",
    )
    .order("starts_at", { ascending: true })
    .limit(200);

  const rows = (bookings ?? []) as HubBookingListRow[];
  const groups = groupBookingsByDateAndDetailer(rows, detailerOrder);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-[0.04em] text-y">BOOKINGS</h1>
          <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
            Grouped by date, then detailer · times in Central · earliest first
          </p>
        </div>
        <Button asChild>
          <Link href="/hub/bookings/new">+ New booking</Link>
        </Button>
      </div>

      <BookingsGroupedList groups={groups} />
    </div>
  );
}
