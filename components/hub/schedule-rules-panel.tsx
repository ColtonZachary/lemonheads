"use client";

import { useMemo, useState } from "react";

import { OpenDayOverridesList } from "@/components/hub/open-day-overrides-list";
import { ScheduleBlocksList } from "@/components/hub/schedule-blocks-list";
import { WeeklyBlocksList } from "@/components/hub/weekly-blocks-list";
import { HubSection } from "@/components/hub/hub-page";
import { HubNativeSelect } from "@/components/hub/hub-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StaffDateOverride } from "@/lib/bookings/date-overrides";
import type { StaffWeeklyBlock } from "@/lib/bookings/weekly-blocks";
import type { BlockDateGroup } from "@/lib/hub/group-schedule-blocks";
import { RULES_TABS, type RulesTab } from "@/lib/hub/schedule-intents";

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

  const staffFilterSelect =
    staff.length > 1 ? (
      <HubNativeSelect
        value={staffFilter}
        onChange={(e) => setStaffFilter(e.target.value)}
        aria-label="Filter by detailer"
        className="h-8 w-auto min-w-[10rem] text-[10px]"
      >
        <option value="all">All detailers</option>
        {staff.map((s) => (
          <option key={s.id} value={s.display_name}>
            {s.display_name}
          </option>
        ))}
      </HubNativeSelect>
    ) : null;

  return (
    <HubSection
      title="Active rules"
      description={`${totalRules} total · ${counts.weekly} weekly · ${counts.exceptions} exceptions · ${counts.blocked} blocked`}
      headerAction={staffFilterSelect}
      compact
    >
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as RulesTab)}
        className="gap-3"
      >
        <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
          {RULES_TABS.map((item) => {
            const count =
              item.id === "weekly"
                ? counts.weekly
                : item.id === "exceptions"
                  ? counts.exceptions
                  : counts.blocked;
            const filtered = tabCount[item.id];
            return (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="rounded-md px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] after:hidden data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
              >
                {item.label}
                <span className="ml-1 text-muted-foreground">
                  {staffFilter === "all" ? count : filtered}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="max-h-56 overflow-y-auto rounded-md border border-border/60 bg-muted/10 px-3 py-2">
          <TabsContent value="weekly" className="mt-0">
            <WeeklyBlocksList blocks={filteredWeekly} variant="panel" />
          </TabsContent>
          <TabsContent value="exceptions" className="mt-0">
            <OpenDayOverridesList overrides={filteredOpen} variant="panel" />
          </TabsContent>
          <TabsContent value="blocked" className="mt-0">
            <ScheduleBlocksList
              groups={filteredGroups}
              embedded
              variant="panel"
            />
          </TabsContent>
        </div>
      </Tabs>
    </HubSection>
  );
}
