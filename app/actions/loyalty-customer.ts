"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppBaseUrl, authRedirectPath } from "@/lib/app-url";
import { formatAuthEmailError } from "@/lib/auth/email-errors";
import { sendMagicLinkAuthEmail } from "@/lib/auth/send-auth-email";
import { linkCustomerAuthUser } from "@/lib/loyalty/link-customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type LoyaltyCustomerActionState = {
  ok: boolean;
  message: string;
};

export async function signInRewardsWithPassword(
  _prev: LoyaltyCustomerActionState,
  formData: FormData,
): Promise<LoyaltyCustomerActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

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
  revalidatePath("/rewards");
  redirect("/rewards");
}

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

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      message: "Server is missing SUPABASE_SERVICE_ROLE_KEY for sign-in emails.",
    };
  }

  const result = await sendMagicLinkAuthEmail(admin, {
    email,
    redirectTo,
    subject: "Your Lemonhead's rewards sign-in link",
    intro:
      "Tap the button below to sign in to your rewards account. Use the same email you use when booking.",
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
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
