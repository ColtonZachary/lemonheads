"use server";

import { revalidatePath } from "next/cache";

import { fetchPublicCatalog } from "@/lib/catalog/public-catalog";
import { syncStaffPackageBlocks } from "@/lib/bookings/staff-package-blocks";
import { staffSlugFromName } from "@/lib/hub/staff-slug";
import { deleteStaffPhoto, uploadStaffPhoto } from "@/lib/hub/staff-photo";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";

export type HubStaffActionState = {
  ok: boolean;
  message: string;
};

const STAFF_PATH = "/hub/staff";

function revalidateStaffPaths() {
  revalidatePath(STAFF_PATH);
  revalidatePath("/hub/bookings/new");
  revalidatePath("/hub/blocks");
  revalidatePath("/team");
  revalidatePath("/book");
}

function photoFromForm(formData: FormData): File | null {
  const raw = formData.get("photo");
  if (raw instanceof File && raw.size > 0) return raw;
  return null;
}

function parseSortOrder(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

export async function createStaffMember(
  _prev: HubStaffActionState,
  formData: FormData,
): Promise<HubStaffActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const display_name = String(formData.get("display_name") ?? "").trim();
  const role_label = String(formData.get("role_label") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const is_detailer = String(formData.get("is_detailer") ?? "") === "on";
  const is_bookable = String(formData.get("is_bookable") ?? "") === "on";
  const sort_order = parseSortOrder(String(formData.get("sort_order") ?? "0"));

  if (!display_name) {
    return { ok: false, message: "Display name is required." };
  }

  const slug = staffSlugFromName(display_name);

  const { error } = await ctx.supabase.from("staff_members").insert({
    slug,
    display_name,
    role_label: role_label || (is_detailer ? "Detailer" : "Team"),
    bio,
    is_detailer,
    is_bookable: is_detailer ? is_bookable : false,
    sort_order,
    active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: "Someone with that name/slug already exists. Use a unique display name.",
      };
    }
    return { ok: false, message: error.message };
  }

  const photo = photoFromForm(formData);
  if (photo) {
    const uploaded = await uploadStaffPhoto(slug, display_name, photo);
    if (!uploaded.ok) {
      return {
        ok: false,
        message: `${display_name} was added, but the photo failed: ${uploaded.error}`,
      };
    }
  }

  revalidateStaffPaths();

  return {
    ok: true,
    message: photo
      ? `${display_name} added with photo.`
      : `${display_name} added to staff.`,
  };
}

export async function updateStaffMember(
  staffId: string,
  _prev: HubStaffActionState,
  formData: FormData,
): Promise<HubStaffActionState> {
  void _prev;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const display_name = String(formData.get("display_name") ?? "").trim();
  const role_label = String(formData.get("role_label") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const is_detailer = String(formData.get("is_detailer") ?? "") === "on";
  const is_bookable = String(formData.get("is_bookable") ?? "") === "on";
  const sort_order = parseSortOrder(String(formData.get("sort_order") ?? "0"));
  const active = String(formData.get("active") ?? "") === "on";

  if (!display_name) {
    return { ok: false, message: "Display name is required." };
  }

  const { data: existing, error: loadError } = await ctx.supabase
    .from("staff_members")
    .select("slug")
    .eq("id", staffId)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, message: "Staff member not found." };
  }

  const { error } = await ctx.supabase
    .from("staff_members")
    .update({
      display_name,
      role_label,
      bio,
      is_detailer,
      is_bookable: is_detailer ? is_bookable : false,
      sort_order,
      active,
    })
    .eq("id", staffId);

  if (error) return { ok: false, message: error.message };

  const catalog = await fetchPublicCatalog(ctx.supabase);
  const allowedKeys = new Set(catalog.packages.map((p) => p.key));
  const blockedKeys = formData.getAll("blocked_package_keys").map(String);
  const blocksResult = await syncStaffPackageBlocks(
    ctx.supabase,
    staffId,
    is_detailer ? blockedKeys : [],
    allowedKeys,
  );
  if (!blocksResult.ok) {
    return {
      ok: false,
      message: `Profile saved, but package blocks failed: ${blocksResult.error}`,
    };
  }

  const photo = photoFromForm(formData);
  if (photo) {
    const uploaded = await uploadStaffPhoto(
      existing.slug,
      display_name,
      photo,
    );
    if (!uploaded.ok) {
      return {
        ok: false,
        message: `Saved profile, but photo upload failed: ${uploaded.error}`,
      };
    }
  }

  revalidateStaffPaths();

  return {
    ok: true,
    message: photo ? "Staff member and photo updated." : "Staff member updated.",
  };
}

export async function toggleStaffMemberActive(
  staffId: string,
  _prev: HubStaffActionState,
  _formData: FormData,
): Promise<HubStaffActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { data: row, error: loadError } = await ctx.supabase
    .from("staff_members")
    .select("display_name, active, is_detailer, is_bookable")
    .eq("id", staffId)
    .maybeSingle();

  if (loadError || !row) {
    return { ok: false, message: "Staff member not found." };
  }

  const nextActive = !row.active;

  const { error } = await ctx.supabase
    .from("staff_members")
    .update({
      active: nextActive,
      is_bookable: nextActive ? row.is_detailer : false,
    })
    .eq("id", staffId);

  if (error) return { ok: false, message: error.message };

  revalidateStaffPaths();

  return {
    ok: true,
    message: nextActive
      ? `${row.display_name} is active again (team page and booking if bookable).`
      : `${row.display_name} deactivated (hidden from team page and booking).`,
  };
}

export async function deleteStaffMember(
  staffId: string,
  _prev: HubStaffActionState,
  _formData: FormData,
): Promise<HubStaffActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { data: row, error: loadError } = await ctx.supabase
    .from("staff_members")
    .select("slug, display_name")
    .eq("id", staffId)
    .maybeSingle();

  if (loadError || !row) {
    return { ok: false, message: "Staff member not found." };
  }

  const { error } = await ctx.supabase
    .from("staff_members")
    .delete()
    .eq("id", staffId);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23503"
          ? "Could not remove — this person is still linked to data that must be cleared first."
          : error.message,
    };
  }

  await deleteStaffPhoto(row.slug);

  revalidateStaffPaths();

  return {
    ok: true,
    message: `${row.display_name} was removed permanently. Their schedule rules and photo are gone; past bookings still show their name.`,
  };
}
