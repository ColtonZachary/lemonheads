import Link from "next/link";

import { BookingPriceDisplay } from "@/components/hub/booking-price-display";
import { Button } from "@/components/ui/button";
import {
  formatCentralDate,
  formatCentralDateTime,
} from "@/lib/hub/format";
import {
  customerProfileHref,
  formatCustomerTotalSpent,
  type CustomerProfile,
} from "@/lib/hub/customer-search";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1 w-full max-w-md rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export function CustomersSearchForm({
  defaultQuery,
}: {
  defaultQuery?: string;
}) {
  return (
    <form method="get" className="mt-8 rounded-md border border-white/10 bg-card2 p-5">
      <label className="block">
        <span className={labelClass}>Email or phone</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery ?? ""}
          placeholder="customer@email.com or 4055551234"
          className={fieldClass}
          autoComplete="off"
          minLength={3}
        />
      </label>
      <p className="mt-2 font-mono text-[9px] text-text/35">
        Email or phone (any format) · at least 4 digits for phone · Central times
        below
      </p>
      <Button type="submit" className="mt-4">
        Search
      </Button>
    </form>
  );
}

export function CustomerMatchList({
  profiles,
  searchQuery,
}: {
  profiles: CustomerProfile[];
  searchQuery: string;
}) {
  return (
    <div className="mt-8 rounded-md border border-white/10">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          Multiple customers
        </h2>
        <p className="mt-1 font-mono text-[9px] text-text/35">
          {profiles.length} matches for &ldquo;{searchQuery}&rdquo; — pick one
        </p>
      </div>
      <ul className="divide-y divide-white/10">
        {profiles.map((p) => (
          <li key={p.email || p.phoneDigits}>
            <Link
              href={customerProfileHref(p)}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-white/[0.03]"
            >
              <div>
                <p className="font-mono text-sm text-text/90">{p.displayName}</p>
                {p.email ? (
                  <p className="font-mono text-xs text-text/50">{p.email}</p>
                ) : null}
                {p.phone ? (
                  <p className="font-mono text-xs text-text/40">{p.phone}</p>
                ) : null}
              </div>
              <div className="text-right font-mono text-[10px] text-text/45">
                <p>
                  {p.bookingCount} job{p.bookingCount === 1 ? "" : "s"}
                </p>
                {p.lastBookingAt ? (
                  <p>Last {formatCentralDate(p.lastBookingAt)}</p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-card2 px-4 py-3">
      <p className={labelClass}>{label}</p>
      <p className="mt-1 font-mono text-sm text-y">{value}</p>
      {sub ? <p className="mt-0.5 font-mono text-[9px] text-text/35">{sub}</p> : null}
    </div>
  );
}

export function CustomerProfileView({ profile }: { profile: CustomerProfile }) {
  const activeBookings = profile.bookings.filter((b) => !b.deleted_at);

  return (
    <div className="mt-8 space-y-6">
      <p className="font-mono text-[9px] text-text/35">
        <Link href="/hub/customers" className="text-y/70 hover:text-y">
          ← New search
        </Link>
      </p>

      <div className="rounded-md border border-white/10 bg-card2 p-5">
        <h2 className="font-display text-3xl tracking-[0.06em] text-y">
          {profile.displayName || "Unknown"}
        </h2>
        {profile.email ? (
          <p className="mt-2 font-mono text-sm text-text/70">{profile.email}</p>
        ) : null}
        {profile.phone ? (
          <p className="font-mono text-sm text-text/50">{profile.phone}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jobs"
          value={String(profile.bookingCount)}
          sub={`${activeBookings.length} active · ${profile.bookings.length - activeBookings.length} removed`}
        />
        <StatCard
          label="Total spent"
          value={formatCustomerTotalSpent(profile.totalSpentCents)}
          sub="Sum of final price on non-deleted jobs"
        />
        <StatCard
          label="First job"
          value={
            profile.firstBookingAt
              ? formatCentralDate(profile.firstBookingAt)
              : "—"
          }
        />
        <StatCard
          label="Last job"
          value={
            profile.lastBookingAt
              ? formatCentralDate(profile.lastBookingAt)
              : "—"
          }
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-card2 font-mono text-[9px] uppercase tracking-[0.14em] text-text/40">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Detailer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Price</th>
            </tr>
          </thead>
          <tbody>
            {profile.bookings.map((b) => (
              <tr
                key={b.id}
                className={cn(
                  "border-b border-white/5 transition-colors hover:bg-white/[0.02]",
                  b.deleted_at && "opacity-45",
                )}
              >
                <td className="px-4 py-3 font-mono text-xs text-text/70">
                  {formatCentralDateTime(b.starts_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/hub/bookings/${b.id}`}
                    className="font-mono text-xs text-y/80 hover:text-y"
                  >
                    {b.reference_id}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text/60">
                  {b.service_name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text/50">
                  {b.detailer_name ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text/45">
                  {b.deleted_at ? "deleted" : b.status}
                </td>
                <td className="px-4 py-3">
                  <BookingPriceDisplay booking={b} stacked />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!profile.bookings.length ? (
          <p className="p-8 text-center font-mono text-xs text-text/40">
            No bookings for this customer.
          </p>
        ) : null}
      </div>
    </div>
  );
}
