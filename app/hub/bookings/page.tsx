import Link from "next/link";

import { requireHubAccess } from "@/lib/auth/require-hub";
import { formatCentralDateTime } from "@/lib/hub/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubBookingsPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();

  const { data: bookings } = await supabase!
    .from("bookings")
    .select(
      "id, reference_id, customer_name, email, phone, service_name, detailer_name, starts_at, status, final_price_cents, price_display, deleted_at",
    )
    .order("starts_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">BOOKINGS</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        Click a reference to edit, cancel, or delete
      </p>

      <div className="mt-8 overflow-x-auto rounded-md border border-white/10">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-card2 font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">When (CT)</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Detailer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Price</th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((b) => (
              <tr
                key={b.id}
                className={`border-b border-white/5 ${b.deleted_at ? "opacity-40" : ""}`}
              >
                <td className="px-4 py-3 font-mono text-xs">
                  <Link
                    href={`/hub/bookings/${b.id}`}
                    className="text-y/80 hover:text-y hover:underline"
                  >
                    {b.reference_id}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text/60">
                  {formatCentralDateTime(b.starts_at)}
                </td>
                <td className="px-4 py-3">
                  <div>{b.customer_name}</div>
                  <div className="font-mono text-[10px] text-text/35">{b.email}</div>
                </td>
                <td className="px-4 py-3">{b.detailer_name ?? "Auto"}</td>
                <td className="px-4 py-3 text-text/60">{b.service_name}</td>
                <td className="px-4 py-3 font-mono text-[10px] uppercase">
                  {b.status}
                  {b.deleted_at ? " · deleted" : ""}
                </td>
                <td className="px-4 py-3">
                  {b.price_display ||
                    (b.final_price_cents != null
                      ? `$${(b.final_price_cents / 100).toFixed(0)}`
                      : "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
