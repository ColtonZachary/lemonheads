import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchCatalogAddons, fetchCatalogPackages } from "@/lib/hub/catalog-db";
import {
  fetchLoyaltyRewardGoals,
  formatRewardGoalDetail,
} from "@/lib/hub/loyalty-db";
import { computeLoyaltyDiscountCents } from "@/lib/loyalty/checkout-discount";
import { linkCustomerAuthUser } from "@/lib/loyalty/link-customer";

export type CheckoutRewardOption = {
  kind: "pending" | "goal";
  id: string;
  redemptionId?: string;
  goalId: string;
  label: string;
  detail: string;
  pointsRequired: number;
  discountCents: number;
  applicable: boolean;
  reason?: string;
};

export type RewardsCheckoutContext = {
  email: string;
  pointsBalance: number;
  options: CheckoutRewardOption[];
};

export async function fetchRewardsCheckoutContext(
  client: SupabaseClient,
  input: {
    packageKey: string;
    vehicleKey: string;
    addonNames: string[];
  },
): Promise<RewardsCheckoutContext | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user?.email) return null;

  await linkCustomerAuthUser(client);

  const { data: customer } = await client
    .from("customers")
    .select("id, email, points_balance")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) return null;

  const [packages, addons, goals, pendingRows] = await Promise.all([
    fetchCatalogPackages(client),
    fetchCatalogAddons(client),
    fetchLoyaltyRewardGoals(client, { activeOnly: true }),
    client
      .from("loyalty_redemptions")
      .select(
        `
        id,
        points_spent,
        goal_id,
        loyalty_reward_goals (
          id,
          title,
          reward_kind,
          reward_package_key,
          reward_addon_name
        )
      `,
      )
      .eq("customer_id", customer.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const packageNames = Object.fromEntries(packages.map((p) => [p.key, p.name]));
  const pkg = packages.find((p) => p.key === input.packageKey && p.active);
  const packageCents = pkg?.prices[input.vehicleKey as keyof typeof pkg.prices] ?? 0;
  const activeAddons = addons.filter((a) => a.active);

  const options: CheckoutRewardOption[] = [];

  for (const row of pendingRows.data ?? []) {
    const goal = row.loyalty_reward_goals as
      | {
          id: string;
          title: string;
          reward_kind: "package" | "addon";
          reward_package_key: string | null;
          reward_addon_name: string | null;
        }
      | null
      | Array<{
          id: string;
          title: string;
          reward_kind: "package" | "addon";
          reward_package_key: string | null;
          reward_addon_name: string | null;
        }>;
    const g = Array.isArray(goal) ? goal[0] : goal;
    if (!g) continue;

    const discount = computeLoyaltyDiscountCents(
      g,
      input.packageKey,
      packageCents,
      input.addonNames,
      activeAddons,
    );

    options.push({
      kind: "pending",
      id: row.id,
      redemptionId: row.id,
      goalId: g.id,
      label: g.title,
      detail: formatRewardGoalDetail(
        {
          id: g.id,
          title: g.title,
          description: "",
          points_required: row.points_spent,
          reward_kind: g.reward_kind,
          reward_package_key: g.reward_package_key,
          reward_addon_name: g.reward_addon_name,
          active: true,
          sort_order: 0,
        },
        packageNames,
      ),
      pointsRequired: row.points_spent,
      discountCents: discount.ok ? discount.discountCents : 0,
      applicable: discount.ok,
      reason: discount.ok ? undefined : discount.message,
    });
  }

  for (const goal of goals) {
    if ((customer.points_balance ?? 0) < goal.points_required) continue;

    const discount = computeLoyaltyDiscountCents(
      goal,
      input.packageKey,
      packageCents,
      input.addonNames,
      activeAddons,
    );

    options.push({
      kind: "goal",
      id: goal.id,
      goalId: goal.id,
      label: goal.title,
      detail: formatRewardGoalDetail(goal, packageNames),
      pointsRequired: goal.points_required,
      discountCents: discount.ok ? discount.discountCents : 0,
      applicable: discount.ok,
      reason: discount.ok ? undefined : discount.message,
    });
  }

  return {
    email: customer.email,
    pointsBalance: customer.points_balance ?? 0,
    options,
  };
}
