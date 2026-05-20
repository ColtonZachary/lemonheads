import Link from "next/link";

import {
  formatBookingPrice,
  formatBookingTimeRange,
  type HubDateGroup,
} from "@/lib/hub/group-bookings";

export function BookingsGroupedList({ groups }: { groups: HubDateGroup[] }) {
  if (!groups.length) {
    return (
      <p className="mt-12 rounded-md border border-white/10 p-10 text-center font-mono text-xs text-text/40">
        No bookings yet.{" "}
        <Link href="/hub/bookings/new" className="text-y/80 hover:text-y">
          Create one
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {groups.map((day) => (
        <section key={day.dateKey}>
          <h2 className="sticky top-0 z-10 border-b border-y/20 bg-dk/95 py-3 font-display text-2xl tracking-[0.06em] text-y backdrop-blur-sm">
            {day.dateLabel}
          </h2>

          <div className="mt-4 space-y-6">
            {day.detailers.map((detailer) => (
              <div
                key={`${day.dateKey}-${detailer.detailerKey}`}
                className="rounded-md border border-white/10"
              >
                <div className="border-b border-white/10 bg-card2 px-4 py-2.5">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                    {detailer.detailerLabel}
                  </h3>
                  <p className="font-mono text-[9px] text-text/30">
                    {detailer.bookings.length} job
                    {detailer.bookings.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 font-mono text-[9px] uppercase tracking-[0.12em] text-text/35">
                        <th className="px-4 py-2">Time (CT)</th>
                        <th className="px-4 py-2">Ref</th>
                        <th className="px-4 py-2">Customer</th>
                        <th className="px-4 py-2">Service</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailer.bookings.map((b) => (
                        <tr
                          key={b.id}
                          className={`border-b border-white/5 last:border-0 ${
                            b.deleted_at ? "opacity-40" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-text/70 whitespace-nowrap">
                            {formatBookingTimeRange(b)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <Link
                              href={`/hub/bookings/${b.id}`}
                              className="text-y/80 hover:text-y hover:underline"
                            >
                              {b.reference_id}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div>{b.customer_name}</div>
                            <div className="font-mono text-[10px] text-text/35">
                              {b.phone}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text/60">
                            {b.service_name}
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] uppercase">
                            {b.status}
                            {b.deleted_at ? " · deleted" : ""}
                          </td>
                          <td className="px-4 py-3">{formatBookingPrice(b)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
