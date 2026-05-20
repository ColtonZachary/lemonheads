import Link from "next/link";

import { requireHubAccess } from "@/lib/auth/require-hub";
import { formatCentralDateTime } from "@/lib/hub/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubCalendarPage() {
  const access = await requireHubAccess();
  const supabase = await createSupabaseServerClient();

  const start = new Date();
  start.setDate(start.getDate() - 1);
  const end = new Date();
  end.setDate(end.getDate() + 14);

  const [{ data: bookings }, { data: blocks }, { data: staff }] = await Promise.all([
    supabase!
      .from("bookings")
      .select(
        "id, reference_id, customer_name, service_name, detailer_name, starts_at, ends_at, status, city",
      )
      .is("deleted_at", null)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at", { ascending: true }),
    supabase!
      .from("schedule_blocks")
      .select("id, reason, starts_at, ends_at, staff_member_id, staff_members(display_name)")
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at", { ascending: true }),
    supabase!.from("staff_members").select("id, display_name").eq("active", true).order("sort_order"),
  ]);

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">CALENDAR</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        All service areas · times in Central
      </p>

      <div className="mt-8 overflow-x-auto rounded-md border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-card2 font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
              <th className="px-4 py-3">When (CT)</th>
              <th className="px-4 py-3">Detailer</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((b) => (
              <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-text/70">
                  {formatCentralDateTime(b.starts_at)}
                </td>
                <td className="px-4 py-3">{b.detailer_name ?? "—"}</td>
                <td className="px-4 py-3">
                  {access.isManager ? (
                    <Link
                      href={`/hub/bookings/${b.id}`}
                      className="hover:text-y hover:underline"
                    >
                      {b.customer_name}
                    </Link>
                  ) : (
                    b.customer_name
                  )}
                </td>
                <td className="px-4 py-3 text-text/60">{b.service_name}</td>
                <td className="px-4 py-3 text-text/50">{b.city || "—"}</td>
                <td className="px-4 py-3 font-mono text-[10px] uppercase text-y/70">
                  {b.status}
                </td>
              </tr>
            ))}
            {(blocks ?? []).map((bl) => (
              <tr
                key={bl.id}
                className="border-b border-white/5 bg-red-500/[0.04] text-text/50"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  {formatCentralDateTime(bl.starts_at)}
                </td>
                <td className="px-4 py-3">
                  {(bl.staff_members as { display_name?: string } | null)?.display_name ??
                    "—"}
                </td>
                <td className="px-4 py-3 italic" colSpan={3}>
                  Blocked: {bl.reason}
                </td>
                <td className="px-4 py-3 font-mono text-[10px]">block</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!bookings?.length && !blocks?.length && (
          <p className="p-8 text-center font-mono text-xs text-text/35">
            No upcoming jobs in the next two weeks.
          </p>
        )}
      </div>

      <p className="mt-4 font-mono text-[10px] text-text/30">
        Active staff: {(staff ?? []).map((s) => s.display_name).join(", ") || "—"}
      </p>
    </div>
  );
}
