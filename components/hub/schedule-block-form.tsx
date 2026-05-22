"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createScheduleBlock,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { HubDateRangePicker } from "@/components/hub/hub-date-range-picker";
import { HubMultiDatePicker } from "@/components/hub/hub-multi-date-picker";
import { HubTimeRangeSelect } from "@/components/hub/hub-time-select";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import { WEEKDAY_LABELS } from "@/lib/bookings/weekly-blocks";
import {
  intentToBlockMode,
  TIME_OFF_SHAPES,
  type ScheduleIntent,
  type TimeOffShape,
} from "@/lib/hub/schedule-intents";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";
import { cn } from "@/lib/utils";

const EMPTY: HubBlockActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1.5 w-full rounded-md border border-white/15 bg-dk px-3 py-2.5 text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

const INTENT_FORM_COPY: Record<
  ScheduleIntent,
  { submit: string; stepWhen: string }
> = {
  time_off: {
    submit: "Save blocked time",
    stepWhen: "Which dates?",
  },
  weekly: {
    submit: "Save weekly pattern",
    stepWhen: "Which weekdays?",
  },
  exception: {
    submit: "Allow bookings",
    stepWhen: "Which date?",
  },
};

function FormStep({
  number,
  title,
  children,
  active,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border p-4 transition-colors",
        active ? "border-y/25 bg-y/[0.03]" : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold",
            active ? "bg-y/20 text-y" : "bg-white/10 text-text/50",
          )}
        >
          {number}
        </span>
        <h3 className="text-sm font-medium text-text/85">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ScheduleBlockForm({
  staff,
  intent,
  intentTitle,
}: {
  staff: { id: string; display_name: string }[];
  intent: ScheduleIntent;
  intentTitle: string;
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
      return `${staffName}'s weekly pattern will be saved. Uncheck all days to clear recurring off-days.`;
    }
    if (intent === "exception" && startDate) {
      return `${staffName} can be booked on ${dateInputToLabel(startDate)} even if that weekday is normally off.`;
    }
    if (intent === "time_off") {
      if (mode === "range" && startDate && endDate) {
        return `${staffName} blocked ${dateInputToLabel(startDate)} – ${dateInputToLabel(endDate)}${allDay ? ", all day each day" : ""}.`;
      }
      if (mode === "custom" && customDates.length > 0) {
        return `${staffName} blocked on ${customDates.length} selected day${customDates.length === 1 ? "" : "s"}.`;
      }
      if (startDate) {
        return `${staffName} blocked on ${dateInputToLabel(startDate)}${allDay ? " (all day)" : ""}.`;
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
      <p className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-text/45">
        No active detailers yet. Add staff under{" "}
        <span className="text-y/80">Staff</span> first.
      </p>
    );
  }

  const showTimedBlock = intent === "time_off";
  const showAllDayOption = intent === "time_off";
  const step2Active = Boolean(staffId);

  return (
    <form
      action={action}
      className="rounded-lg border border-white/10 bg-card/30 p-4 sm:p-5"
    >
      <input type="hidden" name="block_mode" value={mode} />

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-y/80">
        {intentTitle}
      </p>

      {intent === "time_off" && (
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-dk/50 p-1">
          {TIME_OFF_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => setTimeOffShape(shape.id)}
              className={cn(
                "cursor-pointer rounded-md px-2 py-2.5 text-center transition-colors",
                timeOffShape === shape.id
                  ? "bg-y/15 text-y"
                  : "text-text/45 hover:bg-white/[0.05] hover:text-text/70",
              )}
            >
              <span className="block text-xs font-medium">{shape.label}</span>
              <span className="mt-0.5 block text-[10px] text-text/35">
                {shape.hint}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        <FormStep number={1} title="Who is this for?" active={!staffId}>
          <label className="block">
            <span className={labelClass}>Detailer</span>
            <select
              name="staff_member_id"
              required
              className={fieldClass}
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              <option value="" disabled>
                Select a team member…
              </option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </label>
        </FormStep>

        <FormStep number={2} title={copy.stepWhen} active={step2Active}>
          <div className="grid gap-4 sm:grid-cols-2">
            {(mode === "single" || mode === "open_day") && (
              <HubDatePicker
                name="appointment_date"
                label={mode === "open_day" ? "Work date" : "Date"}
                disablePast
                onDateChange={handleStartDateChange}
              />
            )}

            {mode === "range" && (
              <HubDateRangePicker
                onRangeChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
              />
            )}

            {mode === "custom" && (
              <div className="sm:col-span-2">
                <HubMultiDatePicker onSelectionChange={setCustomDates} />
                {customDates.length > 0 && (
                  <p className="mt-2 text-xs text-y/80">
                    {customDates.length} day
                    {customDates.length === 1 ? "" : "s"} selected
                  </p>
                )}
              </div>
            )}

            {mode === "weekly" && (
              <fieldset className="sm:col-span-2">
                <legend className="sr-only">Days off each week</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {WEEKDAY_LABELS.map((label, index) => (
                    <label
                      key={label}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2.5 text-sm transition-colors hover:border-amber-500/30 hover:bg-amber-500/5 has-checked:border-amber-500/40 has-checked:bg-amber-500/10"
                    >
                      <input
                        type="checkbox"
                        name="weekday"
                        value={String(index)}
                        className="size-4 accent-amber-400"
                      />
                      <span className="text-text/80">{label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-text/40">
                  Checked = not bookable every week. Uncheck all to remove their
                  pattern.
                </p>
              </fieldset>
            )}
          </div>

          {showAllDayOption && (
            <label className="mt-4 flex items-start gap-3 rounded-md border border-white/10 bg-dk/40 px-3 py-3 text-sm">
              <input
                type="checkbox"
                name="all_day"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="mt-0.5 size-4"
              />
              <span>
                <span className="text-text/85">All day (8 AM – 4 PM Central)</span>
                <span className="mt-0.5 block text-xs text-text/40">
                  Uncheck for a partial-day block only
                </span>
              </span>
            </label>
          )}

          {showTimedBlock && !allDay && (
            <div className="mt-3">
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
        </FormStep>

        <FormStep number={3} title="Short note" active={step2Active}>
          <label className="block">
            <span className={labelClass}>Reason (shown to your team)</span>
            <input
              name="reason"
              required
              placeholder={
                intent === "weekly"
                  ? "Does not work weekends"
                  : intent === "exception"
                    ? "Picking up extra Saturday shift"
                    : "Vacation"
              }
              className={fieldClass}
            />
          </label>
        </FormStep>
      </div>

      {preview && (
        <div className="mt-4 flex gap-2 rounded-md border border-y/20 bg-y/5 px-3 py-2.5 text-sm text-y/90">
          <Icon name="check" className="mt-0.5 size-4 shrink-0" />
          <span>{preview}</span>
        </div>
      )}

      {mode === "weekly" && <input type="hidden" name="appointment_date" value="" />}

      <Button
        type="submit"
        className="mt-5 w-full sm:w-auto"
        disabled={pending}
      >
        {pending ? "Saving…" : copy.submit}
      </Button>

      {state.message && (
        <p
          className={cn(
            "mt-4 rounded-md border px-4 py-3 text-sm",
            state.ok
              ? "border-y/30 bg-y/10 text-y"
              : "border-red-500/30 bg-red-500/10 text-red-200",
          )}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
