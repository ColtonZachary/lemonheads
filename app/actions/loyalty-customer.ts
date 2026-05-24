"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppBaseUrl, authRedirectPath } from "@/lib/app-url";
import { linkCustomerAuthUser } from "@/lib/loyalty/link-customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoyaltyCustomerActionState = {
  ok: boolean;
  message: string;
};

export async function sendRewardsMagicLink(
  _prev: LoyaltyCustomerActionState,
  formData: FormData,
): Promise<LoyaltyCustomerActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (!getAppBaseUrl()) {
    return {
      ok: false,
      message: "Set NEXT_PUBLIC_APP_URL to your site URL so sign-in links work.",
    };
  }

  const redirectTo = authRedirectPath("/auth/finish?next=/rewards");

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
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "Check your email for a sign-in link. Use the same email you use when booking.",
  };
}

export async function redeemLoyaltyGoal(
  _prev: LoyaltyCustomerActionState,
  formData: FormData,
): Promise<LoyaltyCustomerActionState> {
  const goalId = String(formData.get("goal_id") ?? "").trim();
  if (!goalId) return { ok: false, message: "Missing reward." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Sign-in is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to redeem rewards." };

  await linkCustomerAuthUser(supabase);

  const { data, error } = await supabase.rpc("redeem_loyalty_goal", {
    p_goal_id: goalId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/rewards");
  return {
    ok: true,
    message: data
      ? "Reward redeemed! Our team will apply it on your next visit — mention your rewards account when booking."
      : "Reward redeemed!",
  };
}

export async function signOutRewards(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/rewards");
  redirect("/rewards");
}
