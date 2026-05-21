import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import type { DetailerAvailabilitySnapshot } from "@/lib/bookings/detailer-availability";
import { isTimeSlotSelectableForDateInput } from "@/lib/bookings/scheduling-limits";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [1.5, 2, 2.5, 3, 3.5, 4.5] as const;

export { DURATION_OPTIONS };

export function BookingsAvailabilityForm({
  viewDate,
  durationHours,
}: {
  viewDate: string;
  durationHours: number;
}) {
  return (
    <form
      action="/hub/bookings"
      method="get"
      className="flex flex-wrap items-end gap-4 rounded-md border border-white/10 bg-card2/40 p-5"
    >
      <label className="block">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
          Date (Central)
        </span>
        <input
          type="date"
          name="date"
          required
          defaultValue={viewDate}
          className="mt-1 rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text/40">
          Job length (hours)
        </span>
        <select
          name="duration"
          defaultValue={String(durationHours)}
          className="mt-1 rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm"
        >
          {DURATION_OPTIONS.map((h) => (
            <option key={h} value={String(h)}>
              {h}h
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-[4px] border border-y/30 bg-y/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-y transition-colors hover:bg-y/20"
      >
        View availability
      </button>
      <p className="w-full font-mono text-[9px] text-text/35">
        Uses the same rules as public booking: existing jobs, detailer schedule blocks,
        and weekly patterns.
      </p>
    </form>
  );
}

export function BookingsDayAvailabilityMatrix({
  viewDate,
  dateLabel,
  durationHours,
  detailerNames,
  availability,
}: {
  viewDate: string;
  dateLabel: string;
  durationHours: number;
  detailerNames: string[];
  availability: DetailerAvailabilitySnapshot;
}) {
  if (!detailerNames.length) {
    return (
      <p className="mt-4 rounded-md border border-white/10 p-6 text-sm text-text/45">
        No bookable detailers on the roster. Add active detailers under{" "}
        <span className="text-y/70">Staff</span>.
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-md border border-white/10">
      <div className="border-b border-white/10 bg-card2 px-4 py-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Availability — {dateLabel}
        </h2>
        <p className="mt-1 font-mono text-[9px] text-text/35">
          Assuming a {durationHours}h job · Central Time
        </p>
      </div>
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 font-mono text-[9px] uppercase tracking-[0.12em] text-text/35">
            <th className="px-4 py-2">Time</th>
            {detailerNames.map((name) => (
              <th key={name} className="px-3 py-2 text-center">
                {name.split(" ")[0]}
              </th>
            ))}
            <th className="px-4 py-2 text-center">Overall</th>
          </tr>
        </thead>
        <tbody>
          {BOOKING_TIME_SLOTS.map((slot) => {
            const selectable = isTimeSlotSelectableForDateInput(viewDate, slot);
            const fullyBooked = availability.fullyBookedSlots.includes(slot);
            return (
              <tr key={slot} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-2 font-mono text-xs text-text/70 whitespace-nowrap">
                  {slot}
                </td>
                {detailerNames.map((name) => {
                  const busy =
                    availability.busySlotsByDetailer[name]?.includes(slot) ?? false;
                  return (
                    <td key={name} className="px-3 py-2 text-center">
                      <SlotBadge
                        variant={
                          !selectable
                            ? "closed"
                            : busy
                              ? "busy"
                              : "open"
                        }
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-center">
                  <SlotBadge
                    variant={
                      !selectable
                        ? "closed"
                        : fullyBooked
                          ? "full"
                          : "open"
                    }
                    label={
                      !selectable
                        ? "Closed"
                        : fullyBooked
                          ? "Full"
                          : "Open"
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-4 border-t border-white/10 px-4 py-3 font-mono text-[9px] text-text/40">
        <span className="flex items-center gap-1.5">
          <SlotBadge variant="open" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <SlotBadge variant="busy" /> Booked / blocked
        </span>
        <span className="flex items-center gap-1.5">
          <SlotBadge variant="full" /> All detailers busy
        </span>
        <span className="flex items-center gap-1.5">
          <SlotBadge variant="closed" /> Past or same-day cutoff
        </span>
      </div>
    </div>
  );
}

function SlotBadge({
  variant,
  label,
}: {
  variant: "open" | "busy" | "full" | "closed";
  label?: string;
}) {
  const title =
    label ??
    (variant === "open"
      ? "Available"
      : variant === "busy"
        ? "Busy"
        : variant === "full"
          ? "Full"
          : "Closed");

  return (
    <span
      title={title}
      className={cn(
        "inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em]",
        variant === "open" && "bg-y/15 text-y",
        variant === "busy" && "bg-red-500/15 text-red-200",
        variant === "full" && "bg-red-500/25 text-red-100",
        variant === "closed" && "bg-white/5 text-text/25",
      )}
    >
      {label ??
        (variant === "open" ? "✓" : variant === "closed" ? "—" : "✗")}
    </span>
  );
}
