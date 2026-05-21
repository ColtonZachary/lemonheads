import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BookingDetailForm,
  type HubBookingDetail,
} from "@/components/hub/booking-detail-form";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchBookableDetailerNames } from "@/lib/bookings/bookable-detailers";
import { formatCentralDateTime } from "@/lib/hub/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireHubAccess({ managerOnly: true });
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: booking } = await supabase!
    .from("bookings")
    .select(
      `
      id, reference_id, customer_name, email, phone,
      location_type, address_line, city, zip,
      service_name, vehicle_type, vehicle_info,
      addons, plastic_shine, customer_notes,
      status, starts_at, ends_at,
      detailer_name, detailer_auto_assigned,
      price_display, price_cents, price_override_cents,
      estimated_price_cents, discount_cents, final_price_cents,
      promo_code_id,
      manager_notes, cancellation_reason, cancelled_at, deleted_at,
      promo_codes ( code )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  const detailerNames = await fetchBookableDetailerNames(supabase!);

  const { data: audit } = await supabase!
    .from("booking_audit_log")
    .select("id, action, changes, created_at, profiles(full_name, email)")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <Link
        href="/hub/bookings"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Bookings
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">
        {booking.reference_id}
      </h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        {formatCentralDateTime(booking.starts_at)} Central
        {booking.deleted_at ? " · deleted" : ""}
      </p>

      <div className="mt-8">
        <BookingDetailForm
          booking={booking as HubBookingDetail}
          detailerNames={detailerNames}
        />
      </div>

      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Audit log
        </h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-card2 font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">By</th>
              </tr>
            </thead>
            <tbody>
              {(audit ?? []).map((row) => {
                const actor = row.profiles as
                  | { full_name?: string | null; email?: string | null }
                  | null;
                return (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-text/50">
                      {formatCentralDateTime(row.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] uppercase text-y/70">
                      {row.action}
                    </td>
                    <td className="px-4 py-3 text-text/60">
                      {actor?.full_name || actor?.email || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!audit?.length && (
            <p className="p-6 text-center font-mono text-xs text-text/35">
              No audit entries yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
