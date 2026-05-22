"use client";

import { useMemo, useState } from "react";

import {
  buildCalendarMonth,
  formatDateInputLabel,
  HUB_CALENDAR_MONTHS,
} from "@/lib/hub/calendar-month";
import { cn } from "@/lib/utils";

const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

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
      <span className={labelClass}>Date range *</span>
      <p className="mt-1 text-xs text-text/40">
        One calendar — select the first and last day of time off.
      </p>

      <input type="hidden" name="appointment_date" value={start} required />
      <input type="hidden" name="appointment_date_end" value={end} required />

      <div className="mt-3 rounded-md border border-white/10 bg-card2/30 p-4">
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
                    ? "cursor-not-allowed text-white/15"
                    : "cursor-pointer text-text/65 hover:border-y/30 hover:bg-y/[0.06] hover:text-y",
                  role === "between" && "bg-y/15 text-y/90",
                  (role === "start" || role === "end") &&
                    "border-y bg-y font-bold text-black",
                  role === "start" && !end && "border-y bg-y font-bold text-black",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <p className="mt-3 font-mono text-[10px] text-text/40">
          <span className="text-y/80">{rangeLabel}</span>
          {start && end ? (
            <button
              type="button"
              className="ml-3 cursor-pointer text-text/45 underline hover:text-y"
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
