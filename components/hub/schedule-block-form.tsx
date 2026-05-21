"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

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
import {
  intentToBlockMode,
  SCHEDULE_INTENTS,
  TIME_OFF_SHAPES,
  type ScheduleIntent,
  type TimeOffShape,
} from "@/lib/hub/schedule-intents";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";
import { cn } from "@/lib/utils";

const EMPTY: HubBlockActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

const INTENT_FORM_COPY: Record<
  ScheduleIntent,
  { heading: string; submit: string; stepWhen: string }
> = {
  time_off: {
    heading: "Block time on the calendar",
    submit: "Save blocked time",
    stepWhen: "When are they unavailable?",
  },
  weekly: {
    heading: "Set regular weekly days off",
    submit: "Save weekly pattern",
    stepWhen: "Which days each week?",
  },
  exception: {
    heading: "Allow bookings on one off-day",
    submit: "Allow bookings this day",
    stepWhen: "Which date will they work?",
  },
};

export function ScheduleBlockForm({
  staff,
  intent,
  onIntentChange,
}: {
  staff: { id: string; display_name: string }[];
  intent: ScheduleIntent;
  onIntentChange: (intent: ScheduleIntent) => void;
}) {
  const [state, action, pending] = useActionState(createScheduleBlock, EMPTY);
  const [timeOffShape, setTimeOffShape] = useState<TimeOffShape>("single");
  const [staffId, setStaffId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [allDay, setAllDay] = useState(true);

  const mode = intentToBlockMode(intent, timeOffShape);
  const copy = INTENT_FORM_COPY[intent];

  const timeDateInput =
    mode === "custom" ? (customDates[0] ?? "") : startDate;

  const staffName = staff.find((s) => s.id === staffId)?.display_name;

  const preview = useMemo(() => {
    if (!staffName) return null;
    if (intent === "weekly") {
      return `${staffName}'s weekly pattern will be saved. Uncheck all days to clear their recurring off-days.`;
    }
    if (intent === "exception" && startDate) {
      return `${staffName} can be booked on ${dateInputToLabel(startDate)} even if that weekday is normally off.`;
    }
    if (intent === "time_off") {
      if (mode === "range" && startDate && endDate) {
        return `${staffName} will be blocked ${dateInputToLabel(startDate)} through ${dateInputToLabel(endDate)}${allDay ? " (all day each day)" : ""}.`;
      }
      if (mode === "custom" && customDates.length > 0) {
        return `${staffName} will be blocked on ${customDates.length} selected day${customDates.length === 1 ? "" : "s"}.`;
      }
      if (startDate) {
        return `${staffName} will be blocked on ${dateInputToLabel(startDate)}${allDay ? " (all day)" : ""}.`;
      }
    }
    return null;
  }, [staffName, intent, mode, startDate, endDate, customDates, allDay]);

  useEffect(() => {
    if (intent === "weekly") setAllDay(true);
  }, [intent]);

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

  const showTimedBlock = intent === "time_off";
  const showAllDayOption = intent === "time_off";

  return (
    <form action={action} className="rounded-md border border-white/10 p-6 sm:p-7">
      <input type="hidden" name="block_mode" value={mode} />

      <div className="flex flex-wrap gap-2">
        {SCHEDULE_INTENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onIntentChange(item.id)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
              intent === item.id
                ? "border-y/40 bg-y/15 text-y"
                : "border-white/10 text-text/40 hover:text-text/65",
            )}
          >
            {item.title}
          </button>
        ))}
      </div>

      <h2 className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-y">
        {copy.heading}
      </h2>

      {intent === "time_off" && (
        <div className="mt-4 flex flex-wrap gap-1 rounded border border-white/10 p-0.5">
          {TIME_OFF_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => setTimeOffShape(shape.id)}
              title={shape.hint}
              className={cn(
                "cursor-pointer rounded px-3 py-2 text-left transition-colors",
                timeOffShape === shape.id
                  ? "bg-white/10 text-text/90"
                  : "text-text/45 hover:text-text/70",
              )}
            >
              <span className="block font-mono text-[9px] uppercase tracking-[0.1em]">
                {shape.label}
              </span>
              <span className="mt-0.5 block text-[10px] text-text/35">{shape.hint}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div>
          <p className={labelClass}>Step 1 · Who</p>
          <label className="mt-2 block">
            <span className="sr-only">Team member</span>
            <select
              name="staff_member_id"
              required
              className={fieldClass}
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              <option value="" disabled>
                Select detailer…
              </option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className={labelClass}>Step 2 · {copy.stepWhen}</p>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            {(mode === "single" || mode === "open_day") && (
              <HubDatePicker
                name="appointment_date"
                label={mode === "open_day" ? "Date they will work" : "Date"}
                disablePast
                onDateChange={handleStartDateChange}
              />
            )}

            {mode === "range" && (
              <>
                <HubDatePicker
                  name="appointment_date"
                  label="First day off"
                  disablePast
                  onDateChange={handleStartDateChange}
                />
                <HubDatePicker
                  name="appointment_date_end"
                  label="Last day off"
                  disablePast
                  onDateChange={setEndDate}
                />
              </>
            )}

            {mode === "custom" && (
              <div className="sm:col-span-2">
                <HubMultiDatePicker onSelectionChange={setCustomDates} />
                {customDates.length > 0 && (
                  <p className="mt-2 font-mono text-[9px] text-y/70">
                    {customDates.length} day{customDates.length === 1 ? "" : "s"} selected
                  </p>
                )}
              </div>
            )}

            {mode === "weekly" && (
              <fieldset className="block sm:col-span-2">
                <legend className="sr-only">Days off each week</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {WEEKDAY_LABELS.map((label, index) => (
                    <label
                      key={label}
                      className="flex cursor-pointer items-center gap-2 rounded border border-white/10 px-3 py-2.5 text-sm transition-colors hover:border-amber-500/30 hover:bg-amber-500/5"
                    >
                      <input
                        type="checkbox"
                        name="weekday"
                        value={String(index)}
                        className="size-4 accent-amber-400"
                      />
                      <span className="text-text/75">{label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm text-text/40">
                  Checked days = not bookable every week. Leave all unchecked to remove
                  their weekly pattern.
                </p>
              </fieldset>
            )}
          </div>
        </div>

        <div>
          <p className={labelClass}>Step 3 · Note (required)</p>
          <label className="mt-2 block">
            <span className="sr-only">Reason</span>
            <input
              name="reason"
              required
              placeholder={
                intent === "weekly"
                  ? "Does not work weekends"
                  : intent === "exception"
                    ? "Requested to work this Saturday"
                    : mode === "custom"
                      ? "Scattered PTO"
                      : "Vacation"
              }
              className={fieldClass}
            />
          </label>
        </div>

        {showAllDayOption && (
          <label className="flex items-start gap-3 rounded border border-white/10 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="all_day"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="mt-0.5 size-4"
            />
            <span>
              <span className="text-text/80">All day on each selected date</span>
              <span className="mt-1 block font-mono text-[9px] text-text/35">
                8:00 AM – 4:00 PM Central · uncheck for a partial-day block
              </span>
            </span>
          </label>
        )}

        {showTimedBlock && !allDay && (
          <HubTimeRangeSelect
            dateInput={timeDateInput}
            startName="start_time"
            endName="end_time"
          />
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

      {preview && (
        <p className="mt-5 rounded border border-y/20 bg-y/5 px-4 py-3 text-sm text-y/90">
          {preview}
        </p>
      )}

      {mode === "weekly" && <input type="hidden" name="appointment_date" value="" />}

      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={pending}>
        {pending ? "Saving…" : copy.submit}
      </Button>

      {state.message && (
        <p
          className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
            state.ok
              ? "border-y/30 bg-y/10 text-y"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
