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
import { HubDetailsSection, HubStatCard } from "@/components/hub/hub-page";
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
        <HubStatCard label="Weekly off-days" value={weeklyCount} />
        <HubStatCard label="Extra work days" value={exceptionCount} />
        <HubStatCard label="Blocked dates" value={blockedCount} />
      </div>

      <HubDetailsSection summary="Add schedule rule">
        <p className="text-xs text-muted-foreground">
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
                "cursor-pointer rounded-md border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
                intent === item.id
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/25 hover:text-foreground",
              )}
            >
              {item.shortTitle}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          {activeIntent.description}
        </p>
        <ScheduleBlockForm
          staff={staff}
          intent={intent}
          intentTitle={activeIntent.title}
          compact
        />
      </HubDetailsSection>

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
