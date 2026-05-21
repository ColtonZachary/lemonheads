"use client";

import { useMemo, useState } from "react";

import { getCentralTodayDateInput } from "@/lib/bookings/scheduling-limits";
import {
  buildCalendarMonth,
  formatDateInputLabel,
  HUB_CALENDAR_MONTHS,
  parseDateInput,
} from "@/lib/hub/calendar-month";
import { cn } from "@/lib/utils";

const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";
const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";

type PickerMode = "calendar" | "manual";

export function HubDatePicker({
  name,
  label = "Date",
  required = true,
  defaultValue = "",
  disablePast = true,
  onDateChange,
}: {
  name: string;
  label?: string;
  required?: boolean;
  /** YYYY-MM-DD */
  defaultValue?: string;
  disablePast?: boolean;
  onDateChange?: (dateInput: string) => void;
}) {
  const initial = parseDateInput(defaultValue);
  const today = new Date();

  const [mode, setMode] = useState<PickerMode>("calendar");
  const [dateInput, setDateInput] = useState(defaultValue);
  const [cursor, setCursor] = useState({
    y: initial?.y ?? today.getFullYear(),
    m: initial?.m ?? today.getMonth(),
  });

  const setDate = (value: string) => {
    setDateInput(value);
    onDateChange?.(value);
  };

  const days = useMemo(
    () => buildCalendarMonth(cursor.y, cursor.m, { disablePast }),
    [cursor.y, cursor.m, disablePast],
  );

  return (
    <div className="block sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={labelClass}>
          {label}
          {required ? " *" : ""}
        </span>
        <div className="flex gap-1 rounded border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setMode("calendar")}
            className={cn(
              "cursor-pointer rounded px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
              mode === "calendar"
                ? "bg-y/15 text-y"
                : "text-text/40 hover:text-text/70",
            )}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "cursor-pointer rounded px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
              mode === "manual"
                ? "bg-y/15 text-y"
                : "text-text/40 hover:text-text/70",
            )}
          >
            Type date
          </button>
        </div>
      </div>

      {mode === "calendar" ? (
        <div className="mt-3 rounded-md border border-white/10 bg-card2/30 p-4">
          <input
            type="hidden"
            name={name}
            value={dateInput}
            required={required}
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setCursor((c) =>
                  c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
                )
              }
              className="cursor-pointer rounded border border-white/10 px-3 py-1.5 font-mono text-[10px] text-text/50 transition-colors hover:border-y/25 hover:text-y"
            >
              ← Prev
            </button>
            <div className="font-display text-lg tracking-[0.05em] text-y/90">
              {HUB_CALENDAR_MONTHS[cursor.m]} {cursor.y}
            </div>
            <button
              type="button"
              onClick={() =>
                setCursor((c) =>
                  c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
                )
              }
              className="cursor-pointer rounded border border-white/10 px-3 py-1.5 font-mono text-[10px] text-text/50 transition-colors hover:border-y/25 hover:text-y"
            >
              Next →
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-1 text-center font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-text/30"
              >
                {d}
              </div>
            ))}
            {days.map((cell, i) => {
              if (cell.day === null) {
                return <div key={i} />;
              }
              const selected = dateInput === cell.dateInput;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => cell.dateInput && setDate(cell.dateInput)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded border border-transparent text-sm font-semibold transition-all",
                    cell.disabled
                      ? "cursor-not-allowed text-white/15"
                      : "cursor-pointer text-text/65 hover:border-y/30 hover:bg-y/[0.06] hover:text-y",
                    cell.isToday && !selected && "border-y/20 text-y",
                    selected && "border-y bg-y font-bold text-black",
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <p className="mt-3 font-mono text-[10px] text-text/40">
            {dateInput ? (
              <>
                Selected:{" "}
                <span className="text-y/80">{formatDateInputLabel(dateInput)}</span>
              </>
            ) : (
              "Click a day on the calendar"
            )}
          </p>
        </div>
      ) : (
        <input
          type="date"
          name={name}
          required={required}
          value={dateInput}
          min={disablePast ? getCentralTodayDateInput() : undefined}
          onChange={(e) => {
            setDate(e.target.value);
            const parsed = parseDateInput(e.target.value);
            if (parsed) setCursor({ y: parsed.y, m: parsed.m });
          }}
          className={fieldClass}
        />
      )}
    </div>
  );
}
