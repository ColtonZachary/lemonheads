import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffDateOverride = {
  id: string;
  staff_member_id: string;
  override_date: string;
  reason: string;
  staff_members: { display_name: string } | null;
};

export function openOverridesForDetailer(
  detailerName: string,
  overrides: StaffDateOverride[],
): StaffDateOverride[] {
  return overrides.filter(
    (o) =>
      o.staff_members?.display_name === detailerName ||
      o.staff_members?.display_name?.trim() === detailerName.trim(),
  );
}

export function hasOpenDayOverride(
  detailerName: string,
  dateInput: string,
  overrides: StaffDateOverride[],
): boolean {
  return openOverridesForDetailer(detailerName, overrides).some(
    (o) => o.override_date === dateInput,
  );
}

export async function fetchActiveDateOverrides(
  client: SupabaseClient,
  options?: { fromDate?: string; toDate?: string },
): Promise<StaffDateOverride[]> {
  let query = client
    .from("staff_date_overrides")
    .select(
      "id, staff_member_id, override_date, reason, staff_members(display_name)",
    );

  if (options?.fromDate) {
    query = query.gte("override_date", options.fromDate);
  }
  if (options?.toDate) {
    query = query.lte("override_date", options.toDate);
  }

  const { data, error } = await query.order("override_date", { ascending: true });

  if (error) {
    console.error("[date-overrides] fetch failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    staff_member_id: row.staff_member_id,
    override_date: row.override_date,
    reason: row.reason,
    staff_members: Array.isArray(row.staff_members)
      ? (row.staff_members[0] ?? null)
      : row.staff_members,
  })) as StaffDateOverride[];
}
