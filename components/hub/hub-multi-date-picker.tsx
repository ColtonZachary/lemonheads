"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildCalendarMonth,
  formatDateInputLabel,
  HUB_CALENDAR_MONTHS,
} from "@/lib/hub/calendar-month";
import { cn } from "@/lib/utils";

import { HubFieldLabel } from "@/components/hub/hub-form";
import { Button } from "@/components/ui/button";

export function HubMultiDatePicker({
  onSelectionChange,
}: {
  onSelectionChange?: (dates: string[]) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const days = useMemo(
    () => buildCalendarMonth(cursor.y, cursor.m, { disablePast: true }),
    [cursor.y, cursor.m],
  );

  const sorted = useMemo(
    () => [...selected].sort(),
    [selected],
  );

  useEffect(() => {
    onSelectionChange?.(sorted);
  }, [sorted, onSelectionChange]);

  const toggle = (dateInput: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dateInput)) next.delete(dateInput);
      else next.add(dateInput);
      return next;
    });
  };

  return (
    <div className="block sm:col-span-2">
      <HubFieldLabel>Pick days *</HubFieldLabel>
      <p className="mt-1 font-mono text-[9px] text-muted-foreground">
        Click dates to toggle — not limited to consecutive days
      </p>

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
            if (cell.day === null) return <div key={i} />;
            const isSelected = cell.dateInput
              ? selected.has(cell.dateInput)
              : false;
            return (
              <button
                key={i}
                type="button"
                disabled={cell.disabled || !cell.dateInput}
                onClick={() => cell.dateInput && toggle(cell.dateInput)}
                className={cn(
                  "flex h-9 items-center justify-center rounded border border-transparent text-sm font-semibold transition-all",
                  cell.disabled
                    ? "cursor-not-allowed text-muted-foreground/30"
                    : "cursor-pointer text-foreground/65 hover:border-primary/30 hover:bg-primary/[0.06]",
                  cell.isToday && !isSelected && "border-primary/20 text-primary",
                  isSelected && "border-primary bg-primary font-bold text-primary-foreground",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <p className="mt-3 font-mono text-[10px] text-muted-foreground">
          {sorted.length === 0
            ? "No days selected"
            : `${sorted.length} day${sorted.length === 1 ? "" : "s"} selected`}
        </p>
        {sorted.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sorted.map((d) => (
              <span
                key={d}
                className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[9px] text-primary/80"
              >
                {formatDateInputLabel(d)}
                <button
                  type="button"
                  onClick={() => toggle(d)}
                  className="ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                  aria-label={`Remove ${d}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {sorted.map((d) => (
        <input key={d} type="hidden" name="selected_dates" value={d} />
      ))}
    </div>
  );
}
