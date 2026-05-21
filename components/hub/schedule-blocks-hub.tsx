"use client";

import { useState } from "react";

import { OpenDayOverridesList } from "@/components/hub/open-day-overrides-list";
import { ScheduleBlockForm } from "@/components/hub/schedule-block-form";
import { ScheduleBlocksList } from "@/components/hub/schedule-blocks-list";
import { ScheduleSection } from "@/components/hub/schedule-section";
import { WeeklyBlocksList } from "@/components/hub/weekly-blocks-list";
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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-10">
      <div className="rounded-md border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          What do you need?
        </p>
        <p className="mt-1 text-sm text-text/50">
          Choose the situation first — the form below updates to match.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SCHEDULE_INTENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setIntent(item.id);
                document.getElementById("schedule-form")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={cn(
                "cursor-pointer rounded-md border p-4 text-left transition-colors",
                item.accent,
                intent === item.id && "ring-1 ring-y/50",
              )}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/70">
                {item.title}
              </span>
              <p className="mt-2 text-sm leading-snug text-text/55">{item.description}</p>
              <p className="mt-2 font-mono text-[9px] text-text/35">e.g. {item.example}</p>
            </button>
          ))}
        </div>
      </div>

      <div id="schedule-form" className="scroll-mt-6 max-w-2xl">
        <ScheduleBlockForm staff={staff} intent={intent} onIntentChange={setIntent} />
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              Current schedule rules
            </h2>
            <p className="mt-1 text-sm text-text/45">
              Tap a section to expand. Rules apply to online booking and manager scheduling.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {[
              { id: "section-weekly", label: "Weekly", count: weeklyCount },
              { id: "section-exceptions", label: "Exceptions", count: exceptionCount },
              { id: "section-blocked", label: "Blocked dates", count: blockedCount },
            ].map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className="cursor-pointer rounded border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-text/45 hover:border-y/30 hover:text-y"
              >
                {link.label}
                {link.count > 0 ? ` (${link.count})` : ""}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-5 space-y-4">
          <ScheduleSection
            id="section-weekly"
            title="Regular weekly days off"
            subtitle="Repeats every week — detailers are not bookable on these weekdays"
            count={weeklyCount}
            tone="amber"
            defaultOpen={weeklyCount > 0}
          >
            <WeeklyBlocksList blocks={weeklyRows} />
          </ScheduleSection>

          <ScheduleSection
            id="section-exceptions"
            title="One-time work days"
            subtitle="Overrides weekly off-days for a single date only"
            count={exceptionCount}
            tone="emerald"
            defaultOpen={exceptionCount > 0}
          >
            <OpenDayOverridesList overrides={openDayRows} />
          </ScheduleSection>

          <ScheduleSection
            id="section-blocked"
            title="Blocked dates"
            subtitle="PTO, vacation, or partial-day blocks on specific calendar dates"
            count={blockedCount}
            tone="red"
            defaultOpen={blockedCount > 0}
          >
            <ScheduleBlocksList groups={blockGroups} embedded />
          </ScheduleSection>
        </div>
      </div>
    </div>
  );
}
