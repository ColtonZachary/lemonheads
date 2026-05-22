"use client";

import { useState } from "react";

import { ScheduleBlockForm } from "@/components/hub/schedule-block-form";
import { ScheduleRulesPanel } from "@/components/hub/schedule-rules-panel";
import type { StaffDateOverride } from "@/lib/bookings/date-overrides";
import type { StaffWeeklyBlock } from "@/lib/bookings/weekly-blocks";
import type { BlockDateGroup } from "@/lib/hub/group-schedule-blocks";
import {
  SCHEDULE_INTENTS,
  type ScheduleIntent,
} from "@/lib/hub/schedule-intents";
import { cn } from "@/lib/utils";

export function ScheduleBlocksHub({
  staff,
  weeklyRows,
  openDayRows,
  blockGroups,
}: {
  staff: { id: string; display_name: string }[];
  weeklyRows: StaffWeeklyBlock[];
  openDayRows: StaffDateOverride[];
  blockGroups: BlockDateGroup[];
}) {
  const [intent, setIntent] = useState<ScheduleIntent>("time_off");

  const blockedCount = blockGroups.reduce((n, g) => n + g.blocks.length, 0);
  const weeklyCount = weeklyRows.length;
  const exceptionCount = openDayRows.length;

  const activeIntent = SCHEDULE_INTENTS.find((i) => i.id === intent)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Weekly off-days
          </p>
          <p className="font-display text-2xl text-y">{weeklyCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Extra work days
          </p>
          <p className="font-display text-2xl text-y">{exceptionCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Blocked dates
          </p>
          <p className="font-display text-2xl text-y">{blockedCount}</p>
        </div>
      </div>

      <details className="group rounded-lg border border-white/10 bg-card/30">
        <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-y hover:text-y/90 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="text-text/40 group-open:hidden">+</span>
            <span className="hidden text-text/40 group-open:inline">−</span>
            Add schedule rule
          </span>
        </summary>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-xs text-text/45">
            Pick a rule type, then fill in the short form.
          </p>
          <div
            className="mt-3 flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Rule type"
          >
            {SCHEDULE_INTENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={intent === item.id}
                onClick={() => setIntent(item.id)}
                className={cn(
                  "cursor-pointer rounded border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
                  intent === item.id
                    ? "border-y/30 bg-y/15 text-y"
                    : "border-white/10 text-text/45 hover:border-white/20 hover:text-text/70",
                )}
              >
                {item.shortTitle}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-text/35">
            {activeIntent.description}
          </p>
          <ScheduleBlockForm
            staff={staff}
            intent={intent}
            intentTitle={activeIntent.title}
            compact
          />
        </div>
      </details>

      <ScheduleRulesPanel
        staff={staff}
        weeklyRows={weeklyRows}
        openDayRows={openDayRows}
        blockGroups={blockGroups}
        counts={{
          weekly: weeklyCount,
          exceptions: exceptionCount,
          blocked: blockedCount,
        }}
      />
    </div>
  );
}
