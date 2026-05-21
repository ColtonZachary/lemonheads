import Link from "next/link";

import { BookingCreateForm } from "@/components/hub/booking-create-form";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubBookingNewPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const detailerNames = await fetchBookableDetailerNames(supabase!);

  return (
    <div>
      <Link
        href="/hub/bookings"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Bookings
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">
        NEW BOOKING
      </h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        Creates a job on the team calendar with the same scheduling rules as the
        public book flow
      </p>

      <div className="mt-8 max-w-3xl">
        <BookingCreateForm detailerNames={detailerNames} />
      </div>
    </div>
  );
}
