"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserRole } from "@/lib/auth/types";
import {
  canChangeHubUserRole,
  canDeactivateHubUser,
  canDeleteHubUser,
  canInviteHubRole,
  canManageHubUser,
  type HubAccessTarget,
} from "@/lib/hub/hub-access-permissions";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendHubInviteAuthEmail } from "@/lib/auth/send-auth-email";
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

async function countActiveAdmins(
  client: SupabaseClient,
): Promise<number> {
  const { count, error } = await client
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("active", true);

  if (error) {
    console.error("[hub-managers] count admins:", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Deletes Supabase Auth user (profiles row cascades). Frees email for a new invite. */
async function purgeHubUser(
  admin: SupabaseClient,
  profileId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  await admin
    .from("staff_members")
    .update({ profile_id: null })
    .eq("profile_id", profileId);

  const { error: authError } = await admin.auth.admin.deleteUser(profileId);
  if (authError) {
    return { ok: false, message: authError.message };
  }

  return { ok: true };
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

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role, active")
    .ilike("email", email)
    .maybeSingle();

  if (existingProfile) {
    const existingTarget: HubAccessTarget = {
      id: existingProfile.id,
      role: existingProfile.role as UserRole,
      active: existingProfile.active,
    };
    if (!canDeleteHubUser(ctx.profile, existingTarget)) {
      return {
        ok: false,
        message:
          "That email is already registered. An admin must permanently delete the old account before re-inviting.",
      };
    }
    if (existingTarget.role === "admin") {
      const adminCount = await countActiveAdmins(admin);
      if (adminCount <= 1 && existingProfile.active) {
        return {
          ok: false,
          message: "Cannot replace the only active admin. Add another admin first.",
        };
      }
    }
    const purged = await purgeHubUser(admin, existingProfile.id);
    if (!purged.ok) return { ok: false, message: purged.message };
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

  const inviteResult = await sendHubInviteAuthEmail(admin, {
    email,
    redirectTo,
    fullName: full_name,
    role,
  });

  if (!inviteResult.ok) {
    return { ok: false, message: inviteResult.message };
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: inviteResult.userId,
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

export async function deleteHubUserPermanently(
  profileId: string,
  _prev: HubManagersActionState,
  _formData: FormData,
): Promise<HubManagersActionState> {
  void _formData;
  const ctx = await requireHubAccessActor();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      message: "Server is missing SUPABASE_SERVICE_ROLE_KEY to delete users.",
    };
  }

  const target = await loadTargetProfile(profileId, admin);
  if ("error" in target) return { ok: false, message: target.error };

  if (!canDeleteHubUser(ctx.profile, target)) {
    return { ok: false, message: "You cannot delete this account." };
  }

  if (target.role === "admin") {
    const adminCount = await countActiveAdmins(admin);
    if (adminCount <= 1) {
      return {
        ok: false,
        message: "Cannot delete the only active admin account.",
      };
    }
  }

  const purged = await purgeHubUser(admin, profileId);
  if (!purged.ok) return { ok: false, message: purged.message };

  revalidatePath(MANAGERS_PATH);
  return {
    ok: true,
    message: "User deleted. You can invite that email again.",
  };
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

  const { error } = await writeClient
    .from("profiles")
    .update(patch)
    .eq("id", profileId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(MANAGERS_PATH);
  return { ok: true, message: active ? "Profile updated." : "Hub access removed." };
}
