"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserRole } from "@/lib/auth/types";
import {
  canChangeHubUserRole,
  canDeactivateHubUser,
  canInviteHubRole,
  canManageHubUser,
  type HubAccessTarget,
} from "@/lib/hub/hub-access-permissions";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";
import { getAppBaseUrl } from "@/lib/app-url";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type HubManagersActionState = {
  ok: boolean;
  message: string;
};

const MANAGERS_PATH = "/hub/managers";

const HUB_ROLES: UserRole[] = ["admin", "manager", "detailer"];

async function requireHubAccessActor() {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return ctx;
  if (ctx.profile.role !== "admin" && ctx.profile.role !== "manager") {
    return { error: "Hub access managers only." as const };
  }
  return ctx;
}

async function loadTargetProfile(
  profileId: string,
  readClient: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
): Promise<HubAccessTarget | { error: string }> {
  const { data, error } = await readClient
    .from("profiles")
    .select("id, role, active")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return { error: "Profile not found." };
  }

  return {
    id: data.id,
    role: data.role as UserRole,
    active: data.active,
  };
}

function writeClientForActor(
  actorRole: UserRole,
  managerClient: SupabaseClient,
) {
  if (actorRole === "admin") return managerClient;
  return getSupabaseAdmin();
}

export async function inviteHubUser(
  _prev: HubManagersActionState,
  formData: FormData,
): Promise<HubManagersActionState> {
  const ctx = await requireHubAccessActor();
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
  if (!canInviteHubRole(ctx.profile.role, role)) {
    return { ok: false, message: "You cannot invite that role." };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      message: "Server is missing SUPABASE_SERVICE_ROLE_KEY for invites.",
    };
  }

  const appUrl = getAppBaseUrl();
  if (!appUrl) {
    return {
      ok: false,
      message:
        "Set NEXT_PUBLIC_APP_URL to your Vercel hub URL (e.g. https://your-app.vercel.app) so invite links open the password page.",
    };
  }

  const redirectTo = `${appUrl}/auth/confirm?next=/auth/set-password`;

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

export async function removeHubAccess(
  profileId: string,
  _prev: HubManagersActionState,
  _formData: FormData,
): Promise<HubManagersActionState> {
  void _formData;
  const ctx = await requireHubAccessActor();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const readClient = getSupabaseAdmin() ?? ctx.supabase;
  const target = await loadTargetProfile(profileId, readClient);
  if ("error" in target) return { ok: false, message: target.error };

  if (!canDeactivateHubUser(ctx.profile, target)) {
    return { ok: false, message: "You cannot remove this user's hub access." };
  }

  const writeClient = writeClientForActor(ctx.profile.role, ctx.supabase);
  if (!writeClient) {
    return {
      ok: false,
      message: "Server is missing SUPABASE_SERVICE_ROLE_KEY to update access.",
    };
  }

  const { error } = await writeClient
    .from("profiles")
    .update({ active: false })
    .eq("id", profileId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(MANAGERS_PATH);
  return { ok: true, message: "Hub access removed. They can no longer sign in." };
}

export async function updateHubProfile(
  profileId: string,
  _prev: HubManagersActionState,
  formData: FormData,
): Promise<HubManagersActionState> {
  void _prev;
  const ctx = await requireHubAccessActor();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const readClient = getSupabaseAdmin() ?? ctx.supabase;
  const target = await loadTargetProfile(profileId, readClient);
  if ("error" in target) return { ok: false, message: target.error };

  if (!canManageHubUser(ctx.profile, target)) {
    return { ok: false, message: "You cannot edit this account." };
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? target.role) as UserRole;
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
  if (profileId === ctx.profile.id && ctx.profile.role === "admin" && role !== "admin") {
    return { ok: false, message: "You cannot remove your own admin role." };
  }

  if (!canChangeHubUserRole(ctx.profile, target, role)) {
    return { ok: false, message: "You cannot assign that role." };
  }

  if (!active && !canDeactivateHubUser(ctx.profile, target)) {
    return { ok: false, message: "You cannot remove this user's hub access." };
  }

  const writeClient = writeClientForActor(ctx.profile.role, ctx.supabase);
  if (!writeClient) {
    return {
      ok: false,
      message: "Server is missing SUPABASE_SERVICE_ROLE_KEY to update access.",
    };
  }

  const patch: {
    full_name: string;
    phone: string;
    role: UserRole;
    active: boolean;
  } = {
    full_name,
    phone,
    role,
    active,
  };

  if (ctx.profile.role === "manager") {
    patch.role = "detailer";
  }

  const { error } = await writeClient
    .from("profiles")
    .update(patch)
    .eq("id", profileId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(MANAGERS_PATH);
  return { ok: true, message: active ? "Profile updated." : "Hub access removed." };
}
