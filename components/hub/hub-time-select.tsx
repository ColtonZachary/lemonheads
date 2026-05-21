"use client";

import { useEffect, useMemo, useState } from "react";

import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  isTimeSlotSelectableForDateInput,
  listTimeSlotStates,
} from "@/lib/bookings/scheduling-limits";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export function HubTimeSelect({
  dateInput,
  name,
  label,
  defaultValue = "",
  required = true,
  onDateInputRequired = true,
  value: controlledValue,
  onValueChange,
}: {
  dateInput: string;
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  onDateInputRequired?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const setValue = (next: string) => {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const dateLabel = useMemo(() => {
    if (!dateInput) return null;
    try {
      return dateInputToLabel(dateInput);
    } catch {
      return null;
    }
  }, [dateInput]);

  const slots = useMemo(
    () => listTimeSlotStates(dateLabel),
    [dateLabel],
  );

  useEffect(() => {
    if (!value || !dateInput) return;
    if (!isTimeSlotSelectableForDateInput(dateInput, value)) {
      setValue("");
    }
  }, [dateInput, value]);

  const disabled = onDateInputRequired && !dateInput;

  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required ? " *" : ""}
      </span>
      <select
        name={name}
        required={required}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        className={cn(fieldClass, disabled && "opacity-50")}
      >
        <option value="">{disabled ? "Pick a date first…" : "Select time…"}</option>
        {BOOKING_TIME_SLOTS.map((slot) => {
          const state = slots.find((s) => s.slot === slot);
          const selectable = state?.selectable ?? false;
          return (
            <option key={slot} value={slot} disabled={!selectable}>
              {slot}
              {!selectable && state?.reason === "past" ? " (passed)" : ""}
              {!selectable && state?.reason === "cutoff" ? " (unavailable)" : ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function HubTimeRangeSelect({
  dateInput,
  startName,
  endName,
  startLabel = "Start (CT)",
  endLabel = "End (CT)",
}: {
  dateInput: string;
  startName: string;
  endName: string;
  startLabel?: string;
  endLabel?: string;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const dateLabel = useMemo(() => {
    if (!dateInput) return null;
    try {
      return dateInputToLabel(dateInput);
    } catch {
      return null;
    }
  }, [dateInput]);

  const endSlots = useMemo(() => {
    if (!dateLabel || !start) return listTimeSlotStates(dateLabel);
    const startIdx = BOOKING_TIME_SLOTS.indexOf(
      start as (typeof BOOKING_TIME_SLOTS)[number],
    );
    return BOOKING_TIME_SLOTS.map((slot) => {
      const slotIdx = BOOKING_TIME_SLOTS.indexOf(slot);
      const base = listTimeSlotStates(dateLabel).find((s) => s.slot === slot);
      const afterStart = startIdx >= 0 && slotIdx > startIdx;
      return {
        slot,
        selectable: (base?.selectable ?? false) && afterStart,
        reason: base?.reason ?? ("past" as const),
      };
    });
  }, [dateLabel, start, dateInput]);

  useEffect(() => {
    if (start && dateInput && !isTimeSlotSelectableForDateInput(dateInput, start)) {
      setStart("");
    }
    if (end && dateInput && !isTimeSlotSelectableForDateInput(dateInput, end)) {
      setEnd("");
    }
  }, [dateInput, start, end]);

  useEffect(() => {
    if (!end || !start) return;
    const startIdx = BOOKING_TIME_SLOTS.indexOf(
      start as (typeof BOOKING_TIME_SLOTS)[number],
    );
    const endIdx = BOOKING_TIME_SLOTS.indexOf(
      end as (typeof BOOKING_TIME_SLOTS)[number],
    );
    if (endIdx <= startIdx) setEnd("");
  }, [start, end]);

  const disabled = !dateInput;

  return (
    <>
      <HubTimeSelect
        dateInput={dateInput}
        name={startName}
        label={startLabel}
        value={start}
        onValueChange={setStart}
        required
        onDateInputRequired
      />
      <label className="block">
        <span className={labelClass}>
          {endLabel} *
        </span>
        <select
          name={endName}
          required
          value={end}
          disabled={disabled || !start}
          onChange={(e) => setEnd(e.target.value)}
          className={cn(fieldClass, (disabled || !start) && "opacity-50")}
        >
          <option value="">
            {!dateInput
              ? "Pick a date first…"
              : !start
                ? "Pick start time…"
                : "Select end…"}
          </option>
          {BOOKING_TIME_SLOTS.map((slot) => {
            const state = endSlots.find((s) => s.slot === slot);
            const selectable = state?.selectable ?? false;
            return (
              <option key={slot} value={slot} disabled={!selectable}>
                {slot}
                {!selectable && state?.reason === "past" ? " (passed)" : ""}
              </option>
            );
          })}
        </select>
      </label>
    </>
  );
}
