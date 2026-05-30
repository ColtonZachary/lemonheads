"use client";

import { useMemo, useState } from "react";

import {
  buildCalendarMonth,
  formatDateInputLabel,
  HUB_CALENDAR_MONTHS,
} from "@/lib/hub/calendar-month";
import { cn } from "@/lib/utils";

import { HubFieldLabel } from "@/components/hub/hub-form";
import { Button } from "@/components/ui/button";

function normalizeRange(
  a: string,
  b: string,
): { start: string; end: string } {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

function isInRange(
  dateInput: string,
  start: string,
  end: string,
): "start" | "end" | "between" | false {
  if (!start) return false;
  if (!end) return dateInput === start ? "start" : false;
  if (dateInput === start) return "start";
  if (dateInput === end) return "end";
  if (dateInput > start && dateInput < end) return "between";
  return false;
}

export function HubDateRangePicker({
  onRangeChange,
}: {
  onRangeChange?: (start: string, end: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const days = useMemo(
    () => buildCalendarMonth(cursor.y, cursor.m, { disablePast: true }),
    [cursor.y, cursor.m],
  );

  const applyRange = (nextStart: string, nextEnd: string) => {
    setStart(nextStart);
    setEnd(nextEnd);
    onRangeChange?.(nextStart, nextEnd);
  };

  const onDayClick = (dateInput: string) => {
    if (!start || (start && end)) {
      applyRange(dateInput, "");
      return;
    }
    const { start: s, end: e } = normalizeRange(start, dateInput);
    applyRange(s, e);
  };

  const rangeLabel =
    start && end
      ? `${formatDateInputLabel(start)} – ${formatDateInputLabel(end)}`
      : start
        ? `${formatDateInputLabel(start)} — click last day off`
        : "Click first day off, then last day";

  return (
    <div className="sm:col-span-2">
      <HubFieldLabel>Date range *</HubFieldLabel>
      <p className="mt-1 text-xs text-muted-foreground">
        One calendar — select the first and last day of time off.
      </p>

      <input type="hidden" name="appointment_date" value={start} required />
      <input type="hidden" name="appointment_date_end" value={end} required />

      <div className="mt-3 rounded-md border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-mono text-[10px]"
            onClick={() =>
              setCursor((c) =>
                c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
              )
            }
          >
            ← Prev
          </Button>
          <div className="font-display text-lg tracking-[0.05em] text-primary/90">
            {HUB_CALENDAR_MONTHS[cursor.m]} {cursor.y}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-mono text-[10px]"
            onClick={() =>
              setCursor((c) =>
                c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
              )
            }
          >
            Next →
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-1 text-center font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60"
            >
              {d}
            </div>
          ))}
          {days.map((cell, i) => {
            if (cell.day === null) {
              return <div key={i} />;
            }
            const dateInput = cell.dateInput!;
            const role = isInRange(dateInput, start, end);
            return (
              <button
                key={i}
                type="button"
                disabled={cell.disabled}
                onClick={() => onDayClick(dateInput)}
                className={cn(
                  "flex h-9 items-center justify-center rounded border border-transparent text-sm font-semibold transition-all",
                  cell.disabled
                    ? "cursor-not-allowed text-muted-foreground/30"
                    : "cursor-pointer text-foreground/65 hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary",
                  role === "between" && "bg-primary/15 text-primary/90",
                  (role === "start" || role === "end") &&
                    "border-primary bg-primary font-bold text-primary-foreground",
                  role === "start" && !end && "border-primary bg-primary font-bold text-primary-foreground",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <p className="mt-3 font-mono text-[10px] text-muted-foreground">
          <span className="text-primary/80">{rangeLabel}</span>
          {start && end ? (
            <button
              type="button"
              className="ml-3 cursor-pointer text-muted-foreground underline hover:text-primary"
              onClick={() => applyRange("", "")}
            >
              Clear
            </button>
          ) : null}
        </p>
      </div>
    </div>
  );
}
