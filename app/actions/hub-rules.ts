"use server";

import { revalidatePath } from "next/cache";

import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";

export type HubRulesActionState = {
  ok: boolean;
  message: string;
};

const RULES_PATH = "/hub/settings/rules";

export async function createBlackoutDate(
  _prev: HubRulesActionState,
  formData: FormData,
): Promise<HubRulesActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const date = String(formData.get("blackout_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const areaSlug = String(formData.get("service_area_slug") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "Pick a valid date." };
  }
  if (!reason) {
    return { ok: false, message: "Reason is required (e.g. Holiday, shop closed)." };
  }

  const { error } = await ctx.supabase.from("blackout_dates").insert({
    blackout_date: date,
    reason,
    service_area_slug: areaSlug || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "That date is already blocked for this area." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(RULES_PATH);
  return { ok: true, message: "Blackout date added." };
}

export async function deleteBlackoutDate(
  blackoutId: string,
  _prev: HubRulesActionState,
  _formData: FormData,
): Promise<HubRulesActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase
    .from("blackout_dates")
    .delete()
    .eq("id", blackoutId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(RULES_PATH);
  return { ok: true, message: "Blackout removed." };
}

export async function updateLeadTimeRule(
  _prev: HubRulesActionState,
  formData: FormData,
): Promise<HubRulesActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const ruleKey = String(formData.get("rule_key") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "on";
  const cutoffHour = Number.parseInt(String(formData.get("cutoff_hour") ?? ""), 10);

  if (!ruleKey) return { ok: false, message: "Missing rule." };
  if (!label) return { ok: false, message: "Label is required." };
  if (!Number.isFinite(cutoffHour) || cutoffHour < 0 || cutoffHour > 23) {
    return { ok: false, message: "Cutoff hour must be 0–23 (16 = 4 PM)." };
  }

  const { error } = await ctx.supabase
    .from("lead_time_rules")
    .update({
      label,
      active,
      config: {
        timezone: "America/Chicago",
        cutoff_hour: cutoffHour,
      },
    })
    .eq("rule_key", ruleKey);

  if (error) return { ok: false, message: error.message };

  revalidatePath(RULES_PATH);
  return { ok: true, message: "Lead-time rule saved." };
}
