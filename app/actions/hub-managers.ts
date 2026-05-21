"use server";

import { revalidatePath } from "next/cache";

import type { UserRole } from "@/lib/auth/types";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type HubManagersActionState = {
  ok: boolean;
  message: string;
};

const MANAGERS_PATH = "/hub/managers";

async function requireAdminSupabase() {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return ctx;
  if (ctx.profile.role !== "admin") {
    return { error: "Admins only." as const };
  }
  return ctx;
}

const HUB_ROLES: UserRole[] = ["admin", "manager", "detailer"];

export async function inviteHubUser(
  _prev: HubManagersActionState,
  formData: FormData,
): Promise<HubManagersActionState> {
  const ctx = await requireAdminSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "manager") as UserRole;

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Enter a valid email." };
  }
  if (!full_name) {
    return { ok: false, message: "Full name is required." };
  }
  if (!HUB_ROLES.includes(role)) {
    return { ok: false, message: "Invalid role." };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      message: "Server is missing SUPABASE_SERVICE_ROLE_KEY for invites.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const redirectTo = appUrl
    ? `${appUrl}/auth/callback?next=/hub`
    : undefined;

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

  if (inviteError || !inviteData.user) {
    return {
      ok: false,
      message:
        inviteError?.message ??
        "Could not send invite. User may already exist — update them below.",
    };
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: inviteData.user.id,
    email,
    full_name,
    phone,
    role,
    active: true,
  });

  if (profileError) {
    return { ok: false, message: profileError.message };
  }

  revalidatePath(MANAGERS_PATH);
  return {
    ok: true,
    message: `Invite sent to ${email}. They can set a password from the email link.`,
  };
}

export async function updateHubProfile(
  profileId: string,
  _prev: HubManagersActionState,
  formData: FormData,
): Promise<HubManagersActionState> {
  void _prev;
  const ctx = await requireAdminSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "") as UserRole;
  const active = String(formData.get("active") ?? "") === "on";

  if (!full_name) {
    return { ok: false, message: "Full name is required." };
  }
  if (!HUB_ROLES.includes(role)) {
    return { ok: false, message: "Invalid role." };
  }

  if (profileId === ctx.profile.id && !active) {
    return { ok: false, message: "You cannot deactivate your own account." };
  }
  if (profileId === ctx.profile.id && role !== "admin") {
    return { ok: false, message: "You cannot remove your own admin role." };
  }

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ full_name, phone, role, active })
    .eq("id", profileId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(MANAGERS_PATH);
  return { ok: true, message: "Profile updated." };
}
