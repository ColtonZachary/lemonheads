"use client";

import { useEffect, useMemo, useState } from "react";

import { BOOKING_TIME_SLOTS } from "@/lib/bookings/constants";
import {
  isTimeSlotSelectableForDateInput,
  listTimeSlotStates,
} from "@/lib/bookings/scheduling-limits";
import { HubFormField, HubNativeSelect } from "@/components/hub/hub-form";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";
import { cn } from "@/lib/utils";

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
    if (!dateInput || !value) return;
    if (!isTimeSlotSelectableForDateInput(dateInput, value)) {
      if (controlledValue !== undefined) {
        onValueChange?.("");
      } else {
        setInternalValue("");
      }
    }
    // onValueChange omitted — setState from useState is stable; including it can loop
  }, [dateInput, value, controlledValue]);

  const disabled = onDateInputRequired && !dateInput;

  return (
    <HubFormField label={label} htmlFor={name} required={required} className="w-full min-w-0">
      <HubNativeSelect
        id={name}
        name={name}
        required={required}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        className={cn(disabled && "opacity-50")}
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
      </HubNativeSelect>
    </HubFormField>
  );
}

export function HubTimeRangeSelect({
  dateInput,
  startName,
  endName,
  startLabel = "Block starts",
  endLabel = "Block ends",
  required = true,
  disabled = false,
  onRangeChange,
}: {
  dateInput: string;
  startName: string;
  endName: string;
  startLabel?: string;
  endLabel?: string;
  /** When false (e.g. all-day block), times are not required. */
  required?: boolean;
  disabled?: boolean;
  onRangeChange?: (start: string, end: string) => void;
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

  useEffect(() => {
    onRangeChange?.(start, end);
  }, [start, end, onRangeChange]);

  const dateMissing = !dateInput;
  const fieldsDisabled = disabled || dateMissing;

  return (
    <>
      <HubTimeSelect
        dateInput={dateInput}
        name={disabled ? "start_time_unused" : startName}
        label={startLabel}
        value={start}
        onValueChange={setStart}
        required={required && !disabled}
        onDateInputRequired
      />
      <HubFormField
        label={endLabel}
        htmlFor={endName}
        required={required && !disabled}
      >
        <HubNativeSelect
          id={endName}
          name={disabled ? undefined : endName}
          required={required && !disabled}
          value={end}
          disabled={fieldsDisabled || !start}
          onChange={(e) => setEnd(e.target.value)}
          className={cn((fieldsDisabled || !start) && "opacity-50")}
        >
          <option value="">
            {dateMissing
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
        </HubNativeSelect>
      </HubFormField>
    </>
  );
}
