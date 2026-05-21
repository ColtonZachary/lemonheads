"use client";

import { useActionState, useState } from "react";

import {
  createScheduleBlock,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { HubTimeRangeSelect } from "@/components/hub/hub-time-select";
import { Button } from "@/components/ui/button";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import { cn } from "@/lib/utils";

const EMPTY: HubBlockActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

type BlockMode = "single" | "range";

export function ScheduleBlockForm({
  staff,
}: {
  staff: { id: string; display_name: string }[];
}) {
  const [state, action, pending] = useActionState(createScheduleBlock, EMPTY);
  const [mode, setMode] = useState<BlockMode>("single");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(true);

  const timeDateInput = startDate;

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (mode === "range" && endDate && endDate < value) {
      setEndDate(value);
    }
  };

  if (!staff.length) {
    return (
      <p className="rounded-md border border-white/10 p-4 font-mono text-xs text-text/45">
        No bookable staff in the database. Run{" "}
        <code className="text-y/70">npm run hub:seed</code> first.
      </p>
    );
  }

  return (
    <form action={action} className="rounded-md border border-white/10 p-6">
      <input type="hidden" name="block_mode" value={mode} />

      <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
        Block time
      </h2>
      <p className="mt-1 font-mono text-[9px] text-text/35">
        PTO, vacation, lunch, etc. · Central time
      </p>

      <div className="mt-4 flex gap-1 rounded border border-white/10 p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={cn(
            "cursor-pointer rounded px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em]",
            mode === "single"
              ? "bg-y/15 text-y"
              : "text-text/40 hover:text-text/70",
          )}
        >
          Single day
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("range");
            setAllDay(true);
          }}
          className={cn(
            "cursor-pointer rounded px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em]",
            mode === "range"
              ? "bg-y/15 text-y"
              : "text-text/40 hover:text-text/70",
          )}
        >
          Multiple days
        </button>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Team member *</span>
          <select name="staff_member_id" required className={fieldClass} defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name}
              </option>
            ))}
          </select>
        </label>

        {mode === "single" ? (
          <HubDatePicker
            name="appointment_date"
            label="Date"
            disablePast
            onDateChange={handleStartDateChange}
          />
        ) : (
          <>
            <HubDatePicker
              name="appointment_date"
              label="From date"
              disablePast
              onDateChange={handleStartDateChange}
            />
            <HubDatePicker
              name="appointment_date_end"
              label="Through date"
              disablePast
              defaultValue={endDate}
              onDateChange={setEndDate}
            />
          </>
        )}

        <label className="block sm:col-span-2">
          <span className={labelClass}>Reason *</span>
          <input
            name="reason"
            required
            placeholder={
              mode === "range"
                ? "Vacation, medical leave, out of town"
                : "PTO, doctor appointment, lunch"
            }
            className={fieldClass}
          />
        </label>

        <label className="flex items-center gap-2 sm:col-span-2 text-sm">
          <input
            type="checkbox"
            name="all_day"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="size-4"
          />
          <span>
            All day each day
            <span className="ml-1 font-mono text-[9px] text-text/35">
              (8:00 AM – 4:00 PM Central)
            </span>
          </span>
        </label>

        {!allDay ? (
          <div className="contents">
            <HubTimeRangeSelect
              dateInput={timeDateInput}
              startName="start_time"
              endName="end_time"
            />
          </div>
        ) : (
          <>
            <input type="hidden" name="start_time" value={BOOKING_TIME_SLOTS[0]} />
            <input
              type="hidden"
              name="end_time"
              value={BOOKING_TIME_SLOTS[BOOKING_TIME_SLOTS.length - 1]}
            />
          </>
        )}
      </div>

      {mode === "range" && (
        <p className="mt-4 font-mono text-[9px] text-text/35">
          Creates one block per day in the range (shown on the team calendar each
          day).
        </p>
      )}

      <Button type="submit" className="mt-6" disabled={pending}>
        {pending
          ? "Saving…"
          : mode === "range"
            ? "Add blocks"
            : "Add block"}
      </Button>

      {state.message && (
        <p
          className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
            state.ok
              ? "border-y/30 bg-y/10 text-y"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
