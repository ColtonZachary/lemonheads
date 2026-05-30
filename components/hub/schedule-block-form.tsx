"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createScheduleBlock,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { HubActionAlert } from "@/components/hub/hub-page";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { HubDateRangePicker } from "@/components/hub/hub-date-range-picker";
import {
  HubFieldLabel,
  HubFormField,
  HubInput,
  HubNativeSelect,
} from "@/components/hub/hub-form";
import { HubMultiDatePicker } from "@/components/hub/hub-multi-date-picker";
import { HubTimeRangeSelect } from "@/components/hub/hub-time-select";
import { Button } from "@/components/ui/button";
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

const INTENT_FORM_COPY: Record<
  ScheduleIntent,
  { submit: string; stepWhen: string }
> = {
  time_off: {
    submit: "Save blocked time",
    stepWhen: "Dates",
  },
  weekly: {
    submit: "Save weekly pattern",
    stepWhen: "Weekdays",
  },
  exception: {
    submit: "Allow bookings",
    stepWhen: "Date",
  },
};

export function ScheduleBlockForm({
  staff,
  intent,
  intentTitle,
  compact,
}: {
  staff: { id: string; display_name: string }[];
  intent: ScheduleIntent;
  intentTitle: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(createScheduleBlock, EMPTY);
  const [timeOffShape, setTimeOffShape] = useState<TimeOffShape>("single");
  const [staffId, setStaffId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [allDay, setAllDay] = useState(true);
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");

  const mode = intentToBlockMode(intent, timeOffShape);
  const copy = INTENT_FORM_COPY[intent];

  const timeDateInput =
    mode === "custom" ? (customDates[0] ?? "") : startDate;

  const staffName = staff.find((s) => s.id === staffId)?.display_name;

  const preview = useMemo(() => {
    if (!staffName) return null;
    if (intent === "weekly") {
      return `${staffName} — weekly pattern (uncheck all days to clear).`;
    }
    if (intent === "exception" && startDate) {
      return `${staffName} bookable on ${dateInputToLabel(startDate)}.`;
    }
    if (intent === "time_off") {
      const timeSuffix = allDay
        ? ", all day"
        : blockStartTime && blockEndTime
          ? `, ${blockStartTime} – ${blockEndTime}`
          : "";
      if (mode === "range" && startDate && endDate) {
        return `${staffName} blocked ${dateInputToLabel(startDate)} – ${dateInputToLabel(endDate)}${timeSuffix}.`;
      }
      if (mode === "custom" && customDates.length > 0) {
        return `${staffName} blocked on ${customDates.length} day${customDates.length === 1 ? "" : "s"}${timeSuffix}.`;
      }
      if (startDate) {
        return `${staffName} blocked ${dateInputToLabel(startDate)}${timeSuffix}.`;
      }
    }
    return null;
  }, [
    staffName,
    intent,
    mode,
    startDate,
    endDate,
    customDates,
    allDay,
    blockStartTime,
    blockEndTime,
  ]);

  useEffect(() => {
    if (intent === "weekly") setAllDay(true);
  }, [intent]);

  useEffect(() => {
    if (allDay) {
      setBlockStartTime("");
      setBlockEndTime("");
    }
  }, [allDay]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (mode === "range" && endDate && endDate < value) {
      setEndDate(value);
    }
  };

  if (!staff.length) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        No active detailers. Add staff under <span className="text-primary">Staff</span>{" "}
        first.
      </p>
    );
  }

  const showTimedBlock = intent === "time_off";
  const showAllDayOption = intent === "time_off";

  return (
    <form
      action={action}
      className={cn(
        compact ? "mt-4" : "rounded-lg border border-border bg-card/30 p-4 sm:p-5",
      )}
    >
      <input type="hidden" name="block_mode" value={mode} />

      {!compact ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
          {intentTitle}
        </p>
      ) : null}

      {intent === "time_off" && (
        <div
          className={cn(
            "grid grid-cols-3 gap-1 rounded-md border border-border bg-muted/30 p-1",
            compact ? "mt-0" : "mt-3",
          )}
        >
          {TIME_OFF_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => setTimeOffShape(shape.id)}
              className={cn(
                "cursor-pointer rounded px-2 py-1.5 text-center transition-colors",
                timeOffShape === shape.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              )}
            >
              <span className="block font-mono text-[9px] uppercase tracking-[0.08em]">
                {shape.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          "grid gap-2.5",
          compact ? "mt-3 sm:grid-cols-2" : "mt-4 space-y-3",
        )}
      >
        <HubFormField label="Detailer" htmlFor="schedule-staff" required>
          <HubNativeSelect
            id="schedule-staff"
            name="staff_member_id"
            required
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name}
              </option>
            ))}
          </HubNativeSelect>
        </HubFormField>

        <HubFormField label="Reason" htmlFor="schedule-reason" required>
          <HubInput
            id="schedule-reason"
            name="reason"
            required
            placeholder={
              intent === "weekly"
                ? "Does not work weekends"
                : intent === "exception"
                  ? "Extra Saturday shift"
                  : "Vacation"
            }
          />
        </HubFormField>

        {(mode === "single" || mode === "open_day") && (
          <HubDatePicker
            name="appointment_date"
            label={mode === "open_day" ? "Work date" : "Date"}
            disablePast
            onDateChange={handleStartDateChange}
          />
        )}

        {mode === "range" && (
          <div className="sm:col-span-2">
            <HubFieldLabel className="mb-1 block">{copy.stepWhen}</HubFieldLabel>
            <HubDateRangePicker
              onRangeChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
          </div>
        )}

        {mode === "custom" && (
          <div className="sm:col-span-2">
            <HubMultiDatePicker onSelectionChange={setCustomDates} />
            {customDates.length > 0 ? (
              <p className="mt-1 text-[10px] text-primary">
                {customDates.length} day{customDates.length === 1 ? "" : "s"} selected
              </p>
            ) : null}
          </div>
        )}

        {mode === "weekly" && (
          <fieldset className="sm:col-span-2">
            <legend className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              {copy.stepWhen}
            </legend>
            <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {WEEKDAY_LABELS.map((label, index) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs hover:border-primary/25 has-checked:border-primary/30 has-checked:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    name="weekday"
                    value={String(index)}
                    className="size-3.5 rounded border-input"
                  />
                  <span className="text-foreground/80">{label}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Checked = off every week. Uncheck all to clear.
            </p>
          </fieldset>
        )}

        {showTimedBlock && (
          <div className="space-y-2.5 rounded-md border border-border bg-muted/20 px-3 py-2.5 sm:col-span-2">
            <HubFieldLabel className="block">Block time</HubFieldLabel>
            {showAllDayOption ? (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  name="all_day"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="size-3.5"
                />
                <span className="text-muted-foreground">
                  All day (8 AM – 4 PM Central) — no start/end needed
                </span>
              </label>
            ) : null}
            {allDay ? null : !timeDateInput ? (
              <p className="text-[10px] leading-snug text-muted-foreground">
                Select at least one date above, then choose when the block starts
                and ends.
              </p>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                <HubTimeRangeSelect
                  dateInput={timeDateInput}
                  startName="start_time"
                  endName="end_time"
                  required
                  onRangeChange={(start, end) => {
                    setBlockStartTime(start);
                    setBlockEndTime(end);
                  }}
                />
              </div>
            )}
            {allDay ? (
              <>
                <input
                  type="hidden"
                  name="start_time"
                  value={BOOKING_TIME_SLOTS[0]}
                />
                <input
                  type="hidden"
                  name="end_time"
                  value={BOOKING_TIME_SLOTS[BOOKING_TIME_SLOTS.length - 1]}
                />
              </>
            ) : null}
          </div>
        )}
      </div>

      {preview ? (
        <p className="mt-3 text-[10px] leading-snug text-primary/90">{preview}</p>
      ) : null}

      {mode === "weekly" && <input type="hidden" name="appointment_date" value="" />}

      <Button
        type="submit"
        className="mt-3 h-auto min-h-0 px-4 py-2 text-xs"
        disabled={pending}
      >
        {pending ? "Saving…" : copy.submit}
      </Button>

      <HubActionAlert state={state} className="mt-3" />
    </form>
  );
}
