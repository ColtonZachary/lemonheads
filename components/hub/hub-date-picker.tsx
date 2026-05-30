"use client";

import { useMemo, useState } from "react";

import { HubFieldLabel, HubInput } from "@/components/hub/hub-form";
import { Button } from "@/components/ui/button";
import { getCentralTodayDateInput } from "@/lib/bookings/scheduling-limits";
import {
  buildCalendarMonth,
  formatDateInputLabel,
  HUB_CALENDAR_MONTHS,
  parseDateInput,
} from "@/lib/hub/calendar-month";
import { cn } from "@/lib/utils";

type PickerMode = "calendar" | "manual";

export function HubDatePicker({
  name,
  label = "Date",
  required = true,
  defaultValue = "",
  disablePast = true,
  stacked = false,
  onDateChange,
}: {
  name: string;
  label?: string;
  required?: boolean;
  /** YYYY-MM-DD */
  defaultValue?: string;
  disablePast?: boolean;
  /** Full-width stack (e.g. booking wizard sheet) — avoids sm:col-span-2 grid blowout */
  stacked?: boolean;
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
    <div className={cn("block w-full min-w-0", !stacked && "sm:col-span-2")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HubFieldLabel>
          {label}
          {required ? " *" : ""}
        </HubFieldLabel>
        <div className="flex gap-0.5 rounded-md border border-border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={mode === "calendar" ? "secondary" : "ghost"}
            onClick={() => setMode("calendar")}
            className="h-7 px-2.5 font-mono text-[9px] uppercase tracking-[0.1em]"
          >
            Calendar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "manual" ? "secondary" : "ghost"}
            onClick={() => setMode("manual")}
            className="h-7 px-2.5 font-mono text-[9px] uppercase tracking-[0.1em]"
          >
            Type date
          </Button>
        </div>
      </div>

      {mode === "calendar" ? (
        <div className="mt-3 rounded-md border border-border bg-card/30 p-4">
          <input
            type="hidden"
            name={name}
            value={dateInput}
            required={required}
          />

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setCursor((c) =>
                  c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
                )
              }
              className="font-mono text-[10px]"
            >
              ← Prev
            </Button>
            <div className="font-display text-lg tracking-[0.05em] text-primary">
              {HUB_CALENDAR_MONTHS[cursor.m]} {cursor.y}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setCursor((c) =>
                  c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
                )
              }
              className="font-mono text-[10px]"
            >
              Next →
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-1 text-center font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
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
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : "cursor-pointer text-foreground/70 hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
                    cell.isToday && !selected && "border-primary/30 text-primary",
                    selected && "border-primary bg-primary font-bold text-primary-foreground",
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <p className="mt-3 font-mono text-[10px] text-muted-foreground">
            {dateInput ? (
              <>
                Selected:{" "}
                <span className="text-primary">{formatDateInputLabel(dateInput)}</span>
              </>
            ) : (
              "Click a day on the calendar"
            )}
          </p>
        </div>
      ) : (
        <HubInput
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
          className="mt-2 hub-date-input"
        />
      )}
    </div>
  );
}
