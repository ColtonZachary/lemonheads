"use server";

import type { VehicleKey } from "@/lib/data";
import { authRedirectPath } from "@/lib/app-url";
import { formatAuthEmailError } from "@/lib/auth/email-errors";
import { computeCheckoutPricing } from "@/lib/bookings/checkout-pricing";
import { linkCustomerAuthUser } from "@/lib/loyalty/link-customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type CheckoutSignInResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export type LoyaltyCheckoutApplyResult =
  | {
      ok: true;
      redemptionId: string;
      label: string;
      discountCents: number;
      subtotalCents: number;
      totalCents: number;
    }
  | { ok: false; message: string };

export type RewardsCheckoutContextResult =
  | {
      ok: true;
      email: string;
      pointsBalance: number;
      options: {
        kind: "pending" | "goal";
        id: string;
        redemptionId?: string;
        goalId: string;
        label: string;
        detail: string;
        pointsRequired: number;
        discountCents: number;
        applicable: boolean;
        addAddonAtCheckout: boolean;
        rewardAddonName: string | null;
        reason?: string;
      }[];
    }
  | { ok: false; message: string };

export async function getRewardsCheckoutOptions(input: {
  packageKey: string;
  vehicleKey: VehicleKey;
  addonNames: string[];
}): Promise<RewardsCheckoutContextResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Sign-in is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "not_signed_in" };
  }

  const { fetchRewardsCheckoutContext } = await import(
    "@/lib/loyalty/checkout-context"
  );
  const ctx = await fetchRewardsCheckoutContext(supabase, input);
  if (!ctx) {
    return { ok: false, message: "no_customer" };
  }

  return {
    ok: true,
    email: ctx.email,
    pointsBalance: ctx.pointsBalance,
    options: ctx.options,
  };
}

export async function applyLoyaltyForBooking(input: {
  packageKey: string;
  vehicleKey: VehicleKey;
  addonNames: string[];
  pendingRedemptionId?: string;
  goalId?: string;
  promoCode?: string;
}): Promise<LoyaltyCheckoutApplyResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Booking system is unavailable." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Sign in on the rewards page to use points here." };
  }

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
  };
}

export async function previewCheckoutPricing(input: {
  packageKey: string;
  vehicleKey: VehicleKey;
  addonNames: string[];
  promoCode?: string;
  loyaltyRedemptionId?: string;
}): Promise<
  | {
      ok: true;
      subtotalCents: number;
      promoDiscountCents: number;
      loyaltyDiscountCents: number;
      totalCents: number;
      promoCode: string | null;
    }
  | { ok: false; message: string }
> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, message: "Booking system is unavailable." };
  }

  const pricing = await computeCheckoutPricing(admin, {
    packageKey: input.packageKey,
    vehicleKey: input.vehicleKey,
    addonNames: input.addonNames,
    promoCode: input.promoCode?.trim() || undefined,
    loyaltyRedemptionId: input.loyaltyRedemptionId?.trim() || undefined,
  });

  if (!pricing.ok) return pricing;

  return {
    ok: true,
    subtotalCents: pricing.subtotalCents,
    promoDiscountCents: pricing.promoDiscountCents,
    loyaltyDiscountCents: pricing.loyaltyDiscountCents,
    totalCents: pricing.totalCents,
    promoCode: pricing.promoCode,
  };
}

export async function signInForCheckout(input: {
  email: string;
  password: string;
}): Promise<CheckoutSignInResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (!password) {
    return { ok: false, message: "Enter your password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Sign-in is not configured." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: formatAuthEmailError(error.message) };
  }

  await linkCustomerAuthUser(supabase);
  revalidatePath("/book");
  return { ok: true };
}

export async function sendCheckoutMagicLink(input: {
  email: string;
}): Promise<CheckoutSignInResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const redirectTo = authRedirectPath("/auth/finish?next=/book");

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Sign-in is not configured." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { ok: false, message: formatAuthEmailError(error.message) };
  }

  return {
    ok: true,
    message:
      "Check your email for a sign-in link. Use the same email as your past bookings, then return here to apply rewards.",
  };
}
