import type { SupabaseClient } from "@supabase/supabase-js";

import { logLoyaltyDbIssue } from "@/lib/hub/loyalty-schema";

export type LoyaltyRewardKind = "package" | "addon";

export type LoyaltySettingsRow = {
  enabled: boolean;
  points_per_dollar: number;
};

export type LoyaltyRewardGoalRow = {
  id: string;
  title: string;
  description: string;
  points_required: number;
  reward_kind: LoyaltyRewardKind;
  reward_package_key: string | null;
  reward_addon_name: string | null;
  active: boolean;
  sort_order: number;
};

export type LoyaltyRedemptionRow = {
  id: string;
  customer_id: string;
  goal_id: string;
  points_spent: number;
  status: "pending" | "fulfilled" | "cancelled";
  created_at: string;
  fulfilled_at: string | null;
  customer_email?: string;
  customer_name?: string;
  goal_title?: string;
};

export type LoyaltyTransactionRow = {
  id: string;
  kind: string;
  points: number;
  amount_cents: number | null;
  note: string;
  created_at: string;
  booking_id: string | null;
};

export async function fetchLoyaltySettings(
  client: SupabaseClient,
): Promise<LoyaltySettingsRow & { schemaReady: boolean }> {
  const { data, error } = await client
    .from("loyalty_settings")
    .select("enabled, points_per_dollar")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    logLoyaltyDbIssue("settings", error.message);
    return {
      enabled: true,
      points_per_dollar: 1,
      schemaReady: false,
    };
  }

  return {
    enabled: data?.enabled ?? true,
    points_per_dollar: Number(data?.points_per_dollar ?? 1),
    schemaReady: true,
  };
}

export async function fetchLoyaltyRewardGoals(
  client: SupabaseClient,
  options: { activeOnly?: boolean } = {},
): Promise<LoyaltyRewardGoalRow[]> {
  let query = client
    .from("loyalty_reward_goals")
    .select("*")
    .order("sort_order")
    .order("points_required");

  if (options.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) {
    logLoyaltyDbIssue("goals", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    points_required: row.points_required,
    reward_kind: row.reward_kind as LoyaltyRewardKind,
    reward_package_key: row.reward_package_key,
    reward_addon_name: row.reward_addon_name,
    active: row.active,
    sort_order: row.sort_order,
  }));
}

export async function fetchPendingLoyaltyRedemptions(
  client: SupabaseClient,
): Promise<LoyaltyRedemptionRow[]> {
  const { data, error } = await client
    .from("loyalty_redemptions")
    .select(
      `
      id,
      customer_id,
      goal_id,
      points_spent,
      status,
      created_at,
      fulfilled_at,
      customers ( email, display_name ),
      loyalty_reward_goals ( title )
    `,
    )
    .eq("status", "pending")
    .is("booking_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logLoyaltyDbIssue("redemptions", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const customer = row.customers as
      | { email: string; display_name: string }
      | { email: string; display_name: string }[]
      | null;
    const goal = row.loyalty_reward_goals as
      | { title: string }
      | { title: string }[]
      | null;
    const c = Array.isArray(customer) ? customer[0] : customer;
    const g = Array.isArray(goal) ? goal[0] : goal;

    return {
      id: row.id,
      customer_id: row.customer_id,
      goal_id: row.goal_id,
      points_spent: row.points_spent,
      status: row.status as LoyaltyRedemptionRow["status"],
      created_at: row.created_at,
      fulfilled_at: row.fulfilled_at,
      customer_email: c?.email,
      customer_name: c?.display_name,
      goal_title: g?.title,
    };
  });
}

export function formatRewardGoalDetail(
  goal: LoyaltyRewardGoalRow,
  packageNames: Record<string, string>,
): string {
  if (goal.reward_kind === "package" && goal.reward_package_key) {
    const name = packageNames[goal.reward_package_key] ?? goal.reward_package_key;
    return `Free ${name} package`;
  }
  if (goal.reward_kind === "addon" && goal.reward_addon_name) {
    return `Free add-on: ${goal.reward_addon_name}`;
  }
  return goal.title;
}

export function pointsForSpendCents(
  amountCents: number,
  pointsPerDollar: number,
): number {
  if (amountCents <= 0 || pointsPerDollar <= 0) return 0;
  return Math.floor((amountCents / 100) * pointsPerDollar);
}
