"use server";

import { revalidatePath } from "next/cache";

import { requireHubAccess } from "@/lib/auth/require-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HubChecklistActionState = {
  ok: boolean;
  message: string;
};

const EMPTY: HubChecklistActionState = { ok: false, message: "" };

function revalidateChecklist() {
  revalidatePath("/hub/settings/checklist");
}

export async function createChecklistItem(
  _prev: HubChecklistActionState,
  formData: FormData,
): Promise<HubChecklistActionState> {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { ok: false, message: "Label is required." };

  const sortOrder = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10);

  const { error } = await supabase!.from("detail_checklist_items").insert({
    label,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    active: true,
  });

  if (error) return { ok: false, message: error.message };
  revalidateChecklist();
  return { ok: true, message: "Checklist item added." };
}

export async function updateChecklistItem(
  _prev: HubChecklistActionState,
  formData: FormData,
): Promise<HubChecklistActionState> {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("item_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!id || !label) return { ok: false, message: "Invalid item." };

  const sortOrder = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10);
  const active = formData.get("active") === "on";

  const { error } = await supabase!
    .from("detail_checklist_items")
    .update({
      label,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };
  revalidateChecklist();
  return { ok: true, message: "Saved." };
}

export async function deleteChecklistItem(
  _prev: HubChecklistActionState,
  formData: FormData,
): Promise<HubChecklistActionState> {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("item_id") ?? "");
  if (!id) return { ok: false, message: "Invalid item." };

  const { error } = await supabase!.from("detail_checklist_items").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateChecklist();
  return { ok: true, message: "Item removed." };
}
