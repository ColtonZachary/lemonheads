"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useMemo } from "react";

import {
  setBookingBilled,
  type HubCalendarActionState,
} from "@/app/actions/hub-calendar";
import { DetailJobProgressBadge } from "@/components/hub/detail-job-progress-badge";
import { Button } from "@/components/ui/button";
import { formatCentralTime } from "@/lib/hub/format";
import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import {
  groupBookingsByDetailerAndDay,
  type WeekCalendarBooking,
  type WeekCalendarDetailer,
  type WeekDayColumn,
} from "@/lib/hub/week-calendar";
import { cn } from "@/lib/utils";

const BILLED_ACTION_EMPTY: HubCalendarActionState = { ok: false, message: "" };

function BookingCard({
  booking,
  detailerColor,
  canManage,
}: {
  booking: WeekCalendarBooking;
  detailerColor: string;
  canManage: boolean;
}) {
  const href = canManage ? `/hub/bookings/${booking.id}` : null;
  const [state, action] = useActionState(setBookingBilled, BILLED_ACTION_EMPTY);
  const billed = booking.is_billed;
  const cancelled = booking.status === "cancelled";

  const card = (
    <div
      className={cn(
        "rounded border px-2 py-1.5 text-left text-[11px] leading-snug transition-colors",
        billed
          ? "border-emerald-400/60 bg-emerald-500/20"
          : "border-white/10 bg-white/[0.04]",
        cancelled && "opacity-50",
      )}
      style={
        billed
          ? undefined
          : { borderLeftWidth: 4, borderLeftColor: detailerColor }
      }
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "font-semibold",
            billed ? "text-emerald-100" : "text-text/90",
          )}
        >
          {booking.customer_name}
        </span>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <DetailJobProgressBadge
            status={booking.status}
            detailPhase={booking.detail_phase}
            size="sm"
          />
          {billed && (
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-emerald-300/90">
              Billed
            </span>
          )}
        </div>
      </div>
      <div className={cn("font-mono text-[9px]", billed ? "text-emerald-200/70" : "text-text/45")}>
        {formatCentralTime(booking.starts_at)}
        {booking.city ? ` · ${booking.city}` : ""}
      </div>
      <div className={cn("truncate", billed ? "text-emerald-100/60" : "text-text/50")}>
        {booking.service_name}
      </div>
      {canManage && href && (
        <form action={action} className="mt-1.5" onClick={(e) => e.stopPropagation()}>
          <input type="hidden" name="booking_id" value={booking.id} />
          <input type="hidden" name="billed" value={billed ? "false" : "true"} />
          <button
            type="submit"
            className={cn(
              "font-mono text-[8px] uppercase tracking-[0.1em] underline-offset-2 hover:underline",
              billed ? "text-emerald-200/80" : "text-y/70",
            )}
          >
            {billed ? "Unmark billed" : "Mark billed"}
          </button>
        </form>
      )}
      {state.message && (
        <p className="mt-1 font-mono text-[8px] text-y/80">{state.message}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90">
        {card}
      </Link>
    );
  }

  return card;
}

export function WeekCalendar({
  weekMonday,
  weekLabel,
  days,
  detailers,
  bookings,
  canManage,
  canBook,
  onOpenBook,
  onBookDay,
  onBookSlot,
}: {
  weekMonday: string;
  weekLabel: string;
  days: WeekDayColumn[];
  detailers: WeekCalendarDetailer[];
  bookings: WeekCalendarBooking[];
  canManage: boolean;
  canBook?: boolean;
  onOpenBook?: () => void;
  onBookDay?: (dateKey: string) => void;
  onBookSlot?: (dateKey: string, detailerName: string) => void;
}) {
  const router = useRouter();
  const grid = useMemo(
    () => groupBookingsByDetailerAndDay(bookings, detailers),
    [bookings, detailers],
  );

  const prevWeek = addDaysToDateInput(weekMonday, -7);
  const nextWeek = addDaysToDateInput(weekMonday, 7);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/hub/calendar?week=${prevWeek}`, { scroll: false })
            }
          >
            ← Prev
          </Button>
          <span className="font-display text-2xl tracking-[0.04em] text-y">
            {weekLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/hub/calendar?week=${nextWeek}`, { scroll: false })
            }
          >
            Next →
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40">
            Central Time · Mon–Sun
          </p>
          {canBook && onOpenBook && (
            <Button type="button" size="sm" onClick={onOpenBook}>
              + New booking
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 font-mono text-[9px] uppercase tracking-[0.1em] text-text/50">
        {detailers.map((d) => (
          <span key={d.name} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-emerald-300/80">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-emerald-400/60 bg-emerald-500/30" />
          Billed
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-white/10">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-card2">
              <th className="sticky left-0 z-10 w-[140px] border-r border-white/10 bg-card2 px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                Detailer
              </th>
              {days.map((day) => (
                <th
                  key={day.dateKey}
                  className="min-w-[120px] border-r border-white/5 px-2 py-2 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted last:border-r-0"
                >
                  <div className="text-y/80">{day.weekday}</div>
                  <div className="text-text/50">{day.label}</div>
                  {canBook && onBookDay && (
                    <button
                      type="button"
                      onClick={() => onBookDay(day.dateKey)}
                      className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-y/60 hover:text-y hover:underline"
                    >
                      + Book
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detailers.map((detailer) => {
              const dayMap = grid.get(detailer.name) ?? new Map();
              return (
                <tr
                  key={detailer.name}
                  className="border-b border-white/5 align-top"
                >
                  <td className="sticky left-0 z-10 border-r border-white/10 bg-dk px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: detailer.color }}
                      />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-text/80">
                        {detailer.name}
                      </span>
                    </div>
                  </td>
                  {days.map((day) => {
                    const dayBookings: WeekCalendarBooking[] =
                      dayMap.get(day.dateKey) ?? [];
                    return (
                      <td
                        key={day.dateKey}
                        className="min-w-[120px] border-r border-white/[0.04] p-1.5 align-top last:border-r-0"
                      >
                        <div className="flex min-h-[72px] flex-col gap-1.5">
                          {dayBookings.length === 0 ? (
                            canBook && onBookSlot ? (
                              <button
                                type="button"
                                onClick={() => onBookSlot(day.dateKey, detailer.name)}
                                className="flex min-h-[52px] w-full items-center justify-center rounded border border-dashed border-white/10 font-mono text-[9px] uppercase tracking-[0.1em] text-text/25 transition-colors hover:border-y/30 hover:bg-y/[0.04] hover:text-y/70"
                              >
                                + Book
                              </button>
                            ) : (
                              <span className="px-1 py-2 font-mono text-[9px] text-text/20">
                                —
                              </span>
                            )
                          ) : (
                            dayBookings.map((b) => (
                              <BookingCard
                                key={b.id}
                                booking={b}
                                detailerColor={detailer.color}
                                canManage={canManage}
                              />
                            ))
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {detailers.length === 0 && (
          <p className="p-8 text-center font-mono text-xs text-text/35">
            No detailers configured for this week.
          </p>
        )}
      </div>
    </div>
  );
}
