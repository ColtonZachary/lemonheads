"use client";

import { useActionState, useState } from "react";

import {
  createScheduleBlock,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { HubMultiDatePicker } from "@/components/hub/hub-multi-date-picker";
import { HubTimeRangeSelect } from "@/components/hub/hub-time-select";
import { Button } from "@/components/ui/button";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import { WEEKDAY_LABELS } from "@/lib/bookings/weekly-blocks";
import { cn } from "@/lib/utils";

const EMPTY: HubBlockActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

type BlockMode = "single" | "range" | "custom" | "weekly";

const MODES: { id: BlockMode; label: string }[] = [
  { id: "single", label: "Single day" },
  { id: "range", label: "Date range" },
  { id: "custom", label: "Pick days" },
  { id: "weekly", label: "Every week" },
];

export function ScheduleBlockForm({
  staff,
}: {
  staff: { id: string; display_name: string }[];
}) {
  const [state, action, pending] = useActionState(createScheduleBlock, EMPTY);
  const [mode, setMode] = useState<BlockMode>("single");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [allDay, setAllDay] = useState(true);

  const timeDateInput =
    mode === "custom" ? (customDates[0] ?? "") : startDate;

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

  const showTimedBlock = mode !== "weekly";
  const showAllDayOption = mode !== "weekly";

  return (
    <form action={action} className="rounded-md border border-white/10 p-6">
      <input type="hidden" name="block_mode" value={mode} />

      <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
        Block time
      </h2>
      <p className="mt-1 font-mono text-[9px] text-text/35">
        One-off days, ranges, scattered days, or recurring weekly (e.g. no Sundays)
      </p>

      <div className="mt-4 flex flex-wrap gap-1 rounded border border-white/10 p-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              if (m.id === "weekly") setAllDay(true);
            }}
            className={cn(
              "cursor-pointer rounded px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em]",
              mode === m.id
                ? "bg-y/15 text-y"
                : "text-text/40 hover:text-text/70",
            )}
          >
            {m.label}
          </button>
        ))}
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

        {mode === "single" && (
          <HubDatePicker
            name="appointment_date"
            label="Date"
            disablePast
            onDateChange={handleStartDateChange}
          />
        )}

        {mode === "range" && (
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
              onDateChange={setEndDate}
            />
          </>
        )}

        {mode === "custom" && (
          <HubMultiDatePicker onSelectionChange={setCustomDates} />
        )}

        {mode === "weekly" && (
          <fieldset className="block sm:col-span-2">
            <legend className={labelClass}>Off every week on *</legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WEEKDAY_LABELS.map((label, index) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center gap-2 rounded border border-white/10 px-3 py-2 text-sm hover:border-white/20"
                >
                  <input
                    type="checkbox"
                    name="weekday"
                    value={String(index)}
                    className="size-4"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-2 font-mono text-[9px] text-text/35">
              Example: check Sunday only, or Tuesday + Thursday. Applies every
              week; bookings skip those days for this detailer.
            </p>
          </fieldset>
        )}

        <label className="block sm:col-span-2">
          <span className={labelClass}>Reason *</span>
          <input
            name="reason"
            required
            placeholder={
              mode === "weekly"
                ? "Does not work Sundays"
                : mode === "custom"
                  ? "Scattered PTO days"
                  : "Vacation, medical leave"
            }
            className={fieldClass}
          />
        </label>

        {showAllDayOption && (
          <label className="flex items-center gap-2 sm:col-span-2 text-sm">
            <input
              type="checkbox"
              name="all_day"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-4"
            />
            <span>
              All day each selected day
              <span className="ml-1 font-mono text-[9px] text-text/35">
                (8:00 AM – 4:00 PM Central)
              </span>
            </span>
          </label>
        )}

        {showTimedBlock && !allDay && (
          <div className="contents">
            <HubTimeRangeSelect
              dateInput={timeDateInput}
              startName="start_time"
              endName="end_time"
            />
          </div>
        )}

        {showTimedBlock && allDay && (
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

      {mode === "weekly" && (
        <input type="hidden" name="appointment_date" value="" />
      )}

      <Button type="submit" className="mt-6" disabled={pending}>
        {pending ? "Saving…" : mode === "weekly" ? "Save weekly pattern" : "Add block(s)"}
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
