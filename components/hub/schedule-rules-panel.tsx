"use client";

import { useMemo, useState } from "react";

import { OpenDayOverridesList } from "@/components/hub/open-day-overrides-list";
import { ScheduleBlocksList } from "@/components/hub/schedule-blocks-list";
import { WeeklyBlocksList } from "@/components/hub/weekly-blocks-list";
import type { StaffDateOverride } from "@/lib/bookings/date-overrides";
import type { StaffWeeklyBlock } from "@/lib/bookings/weekly-blocks";
import type { BlockDateGroup } from "@/lib/hub/group-schedule-blocks";
import { RULES_TABS, type RulesTab } from "@/lib/hub/schedule-intents";
import { cn } from "@/lib/utils";

function matchesStaffFilter(
  displayName: string | undefined,
  filter: string,
): boolean {
  if (filter === "all") return true;
  return (displayName ?? "").trim() === filter;
}

export function ScheduleRulesPanel({
  staff,
  weeklyRows,
  openDayRows,
  blockGroups,
  counts,
}: {
  staff: { id: string; display_name: string }[];
  weeklyRows: StaffWeeklyBlock[];
  openDayRows: StaffDateOverride[];
  blockGroups: BlockDateGroup[];
  counts: { weekly: number; exceptions: number; blocked: number };
}) {
  const [tab, setTab] = useState<RulesTab>("weekly");
  const [staffFilter, setStaffFilter] = useState("all");

  const filteredWeekly = useMemo(
    () =>
      weeklyRows.filter((b) =>
        matchesStaffFilter(b.staff_members?.display_name, staffFilter),
      ),
    [weeklyRows, staffFilter],
  );

  const filteredOpen = useMemo(
    () =>
      openDayRows.filter((o) =>
        matchesStaffFilter(o.staff_members?.display_name, staffFilter),
      ),
    [openDayRows, staffFilter],
  );

  const filteredGroups = useMemo(() => {
    if (staffFilter === "all") return blockGroups;
    return blockGroups
      .map((day) => ({
        ...day,
        blocks: day.blocks.filter((b) =>
          matchesStaffFilter(b.staff_members?.display_name, staffFilter),
        ),
      }))
      .filter((day) => day.blocks.length > 0);
  }, [blockGroups, staffFilter]);

  const tabCount: Record<RulesTab, number> = {
    weekly: filteredWeekly.length,
    exceptions: filteredOpen.length,
    blocked: filteredGroups.reduce((n, g) => n + g.blocks.length, 0),
  };

  const totalRules = counts.weekly + counts.exceptions + counts.blocked;

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Active rules
          </h2>
          <p className="mt-0.5 text-[10px] text-text/35">
            {totalRules} total · {counts.weekly} weekly · {counts.exceptions}{" "}
            exceptions · {counts.blocked} blocked
          </p>
        </div>
        {staff.length > 1 ? (
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            aria-label="Filter by detailer"
            className="rounded border border-white/15 bg-dk px-2 py-1 font-mono text-[10px]"
          >
            <option value="all">All detailers</option>
            {staff.map((s) => (
              <option key={s.id} value={s.display_name}>
                {s.display_name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-card/30">
        <div
          className="flex gap-0.5 overflow-x-auto border-b border-white/10 px-2 py-1.5"
          role="tablist"
        >
          {RULES_TABS.map((item) => {
            const count =
              item.id === "weekly"
                ? counts.weekly
                : item.id === "exceptions"
                  ? counts.exceptions
                  : counts.blocked;
            const filtered = tabCount[item.id];
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "cursor-pointer shrink-0 rounded px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
                  tab === item.id
                    ? "bg-y/15 text-y"
                    : "text-text/45 hover:bg-white/[0.04] hover:text-text/70",
                )}
              >
                {item.label}
                <span className="ml-1 text-text/35">
                  {staffFilter === "all" ? count : filtered}
                </span>
              </button>
            );
          })}
        </div>

        <div className="max-h-56 overflow-y-auto px-3 py-2">
          {tab === "weekly" && (
            <WeeklyBlocksList blocks={filteredWeekly} variant="panel" />
          )}
          {tab === "exceptions" && (
            <OpenDayOverridesList overrides={filteredOpen} variant="panel" />
          )}
          {tab === "blocked" && (
            <ScheduleBlocksList
              groups={filteredGroups}
              embedded
              variant="panel"
            />
          )}
        </div>
      </div>
    </section>
  );
}
