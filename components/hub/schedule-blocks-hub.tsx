"use client";

import { useState } from "react";

import { ScheduleBlockForm } from "@/components/hub/schedule-block-form";
import { ScheduleRulesPanel } from "@/components/hub/schedule-rules-panel";
import { Icon } from "@/components/ui/icons";
import type { StaffDateOverride } from "@/lib/bookings/date-overrides";
import type { StaffWeeklyBlock } from "@/lib/bookings/weekly-blocks";
import type { BlockDateGroup } from "@/lib/hub/group-schedule-blocks";
import {
  SCHEDULE_INTENTS,
  type ScheduleIntent,
} from "@/lib/hub/schedule-intents";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "emerald" | "red";
}) {
  const toneClass = {
    amber: "border-amber-500/25 bg-amber-500/[0.06] text-amber-100",
    emerald: "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-100",
    red: "border-red-500/25 bg-red-500/[0.06] text-red-100",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        toneClass,
      )}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl tracking-[0.02em]">{value}</p>
    </div>
  );
}

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
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Weekly off-days" value={weeklyCount} tone="amber" />
        <StatCard label="Extra work days" value={exceptionCount} tone="emerald" />
        <StatCard label="Blocked dates" value={blockedCount} tone="red" />
      </div>

      <div className="max-w-2xl space-y-5">
        <div>
          <h2 className="font-display text-2xl tracking-[0.03em] text-y">
            Add a rule
          </h2>
          <p className="mt-1 text-sm text-text/45">
            Pick what you need, then fill in the short form.
          </p>
        </div>

        <div className="grid gap-2.5">
          {SCHEDULE_INTENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIntent(item.id)}
              className={cn(
                "cursor-pointer rounded-lg border p-4 text-left transition-all",
                item.accent,
                intent === item.id ? item.selectedRing : "border-white/10",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-md",
                    item.iconBg,
                  )}
                >
                  <Icon name={item.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/70">
                    {item.shortTitle}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-text/80">
                    {item.description}
                  </p>
                  <p className="mt-2 text-xs text-text/40">e.g. {item.example}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <ScheduleBlockForm
          staff={staff}
          intent={intent}
          intentTitle={activeIntent.title}
        />
      </div>

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
