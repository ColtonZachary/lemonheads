"use server";

import { revalidatePath } from "next/cache";

import type { LoyaltyRewardKind } from "@/lib/hub/loyalty-db";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";

export type HubLoyaltyActionState = {
  ok: boolean;
  message: string;
};

const LOYALTY_PATH = "/hub/settings/loyalty";

function revalidateLoyalty() {
  revalidatePath(LOYALTY_PATH);
  revalidatePath("/rewards");
}

function parsePointsRequired(raw: string): number | null {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function parsePointsPerDollar(raw: string): number | null {
  const n = Number.parseFloat(raw.trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function parseRewardKind(raw: string): LoyaltyRewardKind | null {
  return raw === "package" || raw === "addon" ? raw : null;
}

export async function updateLoyaltySettings(
  _prev: HubLoyaltyActionState,
  formData: FormData,
): Promise<HubLoyaltyActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const enabled = String(formData.get("enabled") ?? "") === "on";
  const pointsPerDollar = parsePointsPerDollar(
    String(formData.get("points_per_dollar") ?? ""),
  );
  if (pointsPerDollar === null) {
    return { ok: false, message: "Enter a valid points-per-dollar rate (0 or higher)." };
  }

  const { error } = await ctx.supabase
    .from("loyalty_settings")
    .update({ enabled, points_per_dollar: pointsPerDollar })
    .eq("id", 1);

  if (error) return { ok: false, message: error.message };

  revalidateLoyalty();
  return { ok: true, message: "Loyalty settings saved." };
}

export async function createLoyaltyGoal(
  _prev: HubLoyaltyActionState,
  formData: FormData,
): Promise<HubLoyaltyActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const pointsRequired = parsePointsRequired(String(formData.get("points_required") ?? ""));
  const rewardKind = parseRewardKind(String(formData.get("reward_kind") ?? ""));
  const packageKey = String(formData.get("reward_package_key") ?? "").trim() || null;
  const addonName = String(formData.get("reward_addon_name") ?? "").trim() || null;
  const sortOrder = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const active = String(formData.get("active") ?? "") === "on";

  if (!title) return { ok: false, message: "Title is required." };
  if (pointsRequired === null) {
    return { ok: false, message: "Points required must be at least 1." };
  }
  if (!rewardKind) return { ok: false, message: "Select a reward type." };
  if (rewardKind === "package" && !packageKey) {
    return { ok: false, message: "Select a package for this reward." };
  }
  if (rewardKind === "addon" && !addonName) {
    return { ok: false, message: "Select an add-on for this reward." };
  }

  const { error } = await ctx.supabase.from("loyalty_reward_goals").insert({
    title,
    description,
    points_required: pointsRequired,
    reward_kind: rewardKind,
    reward_package_key: rewardKind === "package" ? packageKey : null,
    reward_addon_name: rewardKind === "addon" ? addonName : null,
    sort_order: sortOrder,
    active,
  });

  if (error) return { ok: false, message: error.message };

  revalidateLoyalty();
  return { ok: true, message: "Reward goal added." };
}

export async function updateLoyaltyGoal(
  _prev: HubLoyaltyActionState,
  formData: FormData,
): Promise<HubLoyaltyActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const id = String(formData.get("goal_id") ?? "").trim();
  if (!id) return { ok: false, message: "Missing goal." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const pointsRequired = parsePointsRequired(String(formData.get("points_required") ?? ""));
  const rewardKind = parseRewardKind(String(formData.get("reward_kind") ?? ""));
  const packageKey = String(formData.get("reward_package_key") ?? "").trim() || null;
  const addonName = String(formData.get("reward_addon_name") ?? "").trim() || null;
  const sortOrder = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const active = String(formData.get("active") ?? "") === "on";

  if (!title) return { ok: false, message: "Title is required." };
  if (pointsRequired === null) {
    return { ok: false, message: "Points required must be at least 1." };
  }
  if (!rewardKind) return { ok: false, message: "Select a reward type." };
  if (rewardKind === "package" && !packageKey) {
    return { ok: false, message: "Select a package for this reward." };
  }
  if (rewardKind === "addon" && !addonName) {
    return { ok: false, message: "Select an add-on for this reward." };
  }

  const { error } = await ctx.supabase
    .from("loyalty_reward_goals")
    .update({
      title,
      description,
      points_required: pointsRequired,
      reward_kind: rewardKind,
      reward_package_key: rewardKind === "package" ? packageKey : null,
      reward_addon_name: rewardKind === "addon" ? addonName : null,
      sort_order: sortOrder,
      active,
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidateLoyalty();
  return { ok: true, message: "Reward goal updated." };
}

export async function deleteLoyaltyGoal(
  _prev: HubLoyaltyActionState,
  formData: FormData,
): Promise<HubLoyaltyActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const id = String(formData.get("goal_id") ?? "").trim();
  if (!id) return { ok: false, message: "Missing goal." };

  const { error } = await ctx.supabase.from("loyalty_reward_goals").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidateLoyalty();
  return { ok: true, message: "Reward goal removed." };
}

export async function fulfillLoyaltyRedemption(
  _prev: HubLoyaltyActionState,
  formData: FormData,
): Promise<HubLoyaltyActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const id = String(formData.get("redemption_id") ?? "").trim();
  if (!id) return { ok: false, message: "Missing redemption." };

  const { error } = await ctx.supabase
    .from("loyalty_redemptions")
    .update({
      status: "fulfilled",
      fulfilled_at: new Date().toISOString(),
      fulfilled_by: ctx.profile.id,
    })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return { ok: false, message: error.message };

  revalidateLoyalty();
  return { ok: true, message: "Redemption marked fulfilled." };
}

export async function cancelLoyaltyRedemption(
  _prev: HubLoyaltyActionState,
  formData: FormData,
): Promise<HubLoyaltyActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const id = String(formData.get("redemption_id") ?? "").trim();
  if (!id) return { ok: false, message: "Missing redemption." };

  const { data: redemption, error: fetchError } = await ctx.supabase
    .from("loyalty_redemptions")
    .select("id, customer_id, points_spent, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !redemption) {
    return { ok: false, message: fetchError?.message ?? "Redemption not found." };
  }
  if (redemption.status !== "pending") {
    return { ok: false, message: "Only pending redemptions can be cancelled." };
  }

  const { data: customer } = await ctx.supabase
    .from("customers")
    .select("points_balance")
    .eq("id", redemption.customer_id)
    .single();

  if (!customer) return { ok: false, message: "Customer not found." };

  const refund = redemption.points_spent as number;

  const { error: balanceError } = await ctx.supabase
    .from("customers")
    .update({
      points_balance: (customer.points_balance ?? 0) + refund,
    })
    .eq("id", redemption.customer_id);

  if (balanceError) return { ok: false, message: balanceError.message };

  await ctx.supabase.from("loyalty_transactions").insert({
    customer_id: redemption.customer_id,
    redemption_id: id,
    kind: "adjust",
    points: refund,
    note: "Redemption cancelled — points refunded",
    created_by: ctx.profile.id,
  });

  const { error: updateError } = await ctx.supabase
    .from("loyalty_redemptions")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (updateError) return { ok: false, message: updateError.message };

  revalidateLoyalty();
  return { ok: true, message: "Redemption cancelled and points refunded." };
}
