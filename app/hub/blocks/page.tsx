import { ScheduleBlockForm } from "@/components/hub/schedule-block-form";
import { ScheduleBlocksList } from "@/components/hub/schedule-blocks-list";
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

  const [{ data: staff }, { data: blocks }] = await Promise.all([
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

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">
        SCHEDULE BLOCKS
      </h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        Block detailer time (PTO, lunch, etc.) · grouped by date · shown on team
        calendar
      </p>

      <div className="mt-8 max-w-xl">
        <ScheduleBlockForm staff={staff ?? []} />
      </div>

      <ScheduleBlocksList groups={groups} />
    </div>
  );
}
