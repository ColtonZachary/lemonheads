import type { SupabaseClient } from "@supabase/supabase-js";

import type { VehicleKey } from "@/lib/data";
import { computeCheckoutPricing } from "@/lib/bookings/checkout-pricing";
import { linkCustomerAuthUser } from "@/lib/loyalty/link-customer";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type LoyaltyApplyResult =
  | {
      ok: true;
      redemptionId: string;
      label: string;
      discountCents: number;
      subtotalCents: number;
      totalCents: number;
      totalDisplay: string;
    }
  | { ok: false; message: string };

export async function applyCheckoutLoyalty(
  supabase: SupabaseClient,
  input: {
    packageKey: string;
    vehicleKey: VehicleKey;
    addonNames: string[];
    pendingRedemptionId?: string;
    goalId?: string;
    promoCode?: string;
  },
): Promise<LoyaltyApplyResult> {
  await linkCustomerAuthUser(supabase);

  let redemptionId = input.pendingRedemptionId?.trim() || null;

  if (!redemptionId && input.goalId?.trim()) {
    const { data, error } = await supabase.rpc("redeem_loyalty_goal", {
      p_goal_id: input.goalId.trim(),
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    redemptionId = typeof data === "string" ? data : null;
  }

  if (!redemptionId) {
    return { ok: false, message: "Select a reward to apply." };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, message: "Booking system is unavailable." };
  }

  const pricing = await computeCheckoutPricing(admin, {
    packageKey: input.packageKey,
    vehicleKey: input.vehicleKey,
    addonNames: input.addonNames,
    promoCode: input.promoCode?.trim() || undefined,
    loyaltyRedemptionId: redemptionId,
  });

  if (!pricing.ok) {
    return { ok: false, message: pricing.message };
  }
  if (!pricing.loyaltyRedemptionId || pricing.loyaltyDiscountCents <= 0) {
    return { ok: false, message: "This reward does not apply to this booking." };
  }

  const { data: redemption } = await admin
    .from("loyalty_redemptions")
    .select("loyalty_reward_goals ( title )")
    .eq("id", redemptionId)
    .maybeSingle();

  const goal = redemption?.loyalty_reward_goals as
    | { title: string }
    | { title: string }[]
    | null;
  const title = Array.isArray(goal) ? goal[0]?.title : goal?.title;

  return {
    ok: true,
    redemptionId: pricing.loyaltyRedemptionId,
    label: title ?? "Rewards",
    discountCents: pricing.loyaltyDiscountCents,
    subtotalCents: pricing.subtotalCents,
    totalCents: pricing.totalCents,
    totalDisplay: `$${(pricing.totalCents / 100).toFixed(2)}`,
  };
}
