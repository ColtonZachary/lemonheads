import { ScheduleBlocksHub } from "@/components/hub/schedule-blocks-hub";
import type { StaffDateOverride } from "@/lib/bookings/date-overrides";
import type { StaffWeeklyBlock } from "@/lib/bookings/weekly-blocks";
import { requireHubAccess } from "@/lib/auth/require-hub";
import {
  groupBlocksByDate,
  type ScheduleBlockRow,
} from "@/lib/hub/group-schedule-blocks";
import { DETAILER_NAMES } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubBlocksPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();

  const start = new Date();
  start.setDate(start.getDate() - 14);
  const end = new Date();
  end.setDate(end.getDate() + 90);

  const overrideFrom = start.toISOString().slice(0, 10);
  const overrideTo = end.toISOString().slice(0, 10);

  const [{ data: staff }, { data: blocks }, { data: weekly }, { data: openDays }] =
    await Promise.all([
      supabase!
        .from("staff_members")
        .select("id, display_name")
        .eq("active", true)
        .eq("is_detailer", true)
        .order("sort_order"),
      supabase!
        .from("schedule_blocks")
        .select(
          "id, starts_at, ends_at, reason, staff_member_id, staff_members(display_name)",
        )
        .gte("starts_at", start.toISOString())
        .lte("starts_at", end.toISOString())
        .order("starts_at", { ascending: true }),
      supabase!
        .from("staff_weekly_blocks")
        .select(
          "id, staff_member_id, day_of_week, all_day, reason, staff_members(display_name)",
        )
        .eq("active", true)
        .order("day_of_week"),
      supabase!
        .from("staff_date_overrides")
        .select(
          "id, staff_member_id, override_date, reason, staff_members(display_name)",
        )
        .gte("override_date", overrideFrom)
        .lte("override_date", overrideTo)
        .order("override_date"),
    ]);

  const rows: ScheduleBlockRow[] = (blocks ?? []).map((b) => ({
    id: b.id,
    starts_at: b.starts_at,
    ends_at: b.ends_at,
    reason: b.reason,
    staff_member_id: b.staff_member_id,
    staff_members: Array.isArray(b.staff_members)
      ? (b.staff_members[0] ?? null)
      : b.staff_members,
  }));

  const groups = groupBlocksByDate(rows, DETAILER_NAMES);

  const openDayRows: StaffDateOverride[] = (openDays ?? []).map((o) => ({
    id: o.id,
    staff_member_id: o.staff_member_id,
    override_date: o.override_date,
    reason: o.reason,
    staff_members: Array.isArray(o.staff_members)
      ? (o.staff_members[0] ?? null)
      : o.staff_members,
  }));

  const weeklyRows: StaffWeeklyBlock[] = (weekly ?? []).map((w) => ({
    id: w.id,
    staff_member_id: w.staff_member_id,
    day_of_week: w.day_of_week,
    all_day: w.all_day,
    reason: w.reason,
    staff_members: Array.isArray(w.staff_members)
      ? (w.staff_members[0] ?? null)
      : w.staff_members,
  }));

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">
        TEAM SCHEDULE
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Control when each detailer can be booked — time off, regular days off, or
        one-time exceptions when they pick up an extra shift.
      </p>

      <div className="mt-10">
        <ScheduleBlocksHub
          staff={staff ?? []}
          weeklyRows={weeklyRows}
          openDayRows={openDayRows}
          blockGroups={groups}
        />
      </div>
    </div>
  );
}
