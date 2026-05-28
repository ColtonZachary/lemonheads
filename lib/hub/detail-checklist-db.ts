import type { SupabaseClient } from "@supabase/supabase-js";

export type DetailChecklistItemRow = {
  id: string;
  label: string;
  sort_order: number;
  active: boolean;
};

export async function fetchDetailChecklistItems(
  client: SupabaseClient,
  options: { activeOnly?: boolean } = {},
): Promise<DetailChecklistItemRow[]> {
  let q = client
    .from("detail_checklist_items")
    .select("id, label, sort_order, active")
    .order("sort_order");

  if (options.activeOnly) {
    q = q.eq("active", true);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[checklist] fetch items:", error.message);
    return [];
  }
  return (data ?? []) as DetailChecklistItemRow[];
}
