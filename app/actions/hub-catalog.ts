"use server";

import { revalidatePath } from "next/cache";

import { isAddonIcon } from "@/lib/hub/catalog-icons";
import { vehicleKeysForCatalog } from "@/lib/hub/catalog-db";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";
import { VEHICLE_OPTIONS } from "@/lib/data";

export type HubCatalogActionState = {
  ok: boolean;
  message: string;
};

const CATALOG_PATHS = ["/hub/catalog", "/hub/catalog/packages", "/hub/catalog/addons", "/hub/catalog/locations"];

function revalidateCatalog() {
  for (const path of CATALOG_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/hub/bookings/new");
  revalidatePath("/book");
}

function parseSortOrder(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function parseDollarsToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const amount = Number.parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function parseFeatures(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function packageKeyFromInput(raw: string): string | null {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return key.length > 0 ? key.slice(0, 48) : null;
}

/* ── Packages ── */

export async function createCatalogPackage(
  _prev: HubCatalogActionState,
  formData: FormData,
): Promise<HubCatalogActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const key = packageKeyFromInput(String(formData.get("key") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const features = parseFeatures(String(formData.get("features") ?? ""));
  const duration_hours = Number.parseFloat(String(formData.get("duration_hours") ?? "2"));
  const featured = String(formData.get("featured") ?? "") === "on";
  const sort_order = parseSortOrder(String(formData.get("sort_order") ?? "0"));

  if (!key) return { ok: false, message: "Package key is required (e.g. fully, quickie)." };
  if (!name) return { ok: false, message: "Package name is required." };
  if (!Number.isFinite(duration_hours) || duration_hours <= 0) {
    return { ok: false, message: "Duration must be a positive number of hours." };
  }

  const { error } = await ctx.supabase.from("catalog_packages").insert({
    key,
    name,
    description,
    features,
    duration_hours,
    featured,
    active: true,
    sort_order,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "That package key already exists." };
    return { ok: false, message: error.message };
  }

  const priceRows = VEHICLE_OPTIONS.map((v) => {
    const cents = parseDollarsToCents(String(formData.get(`price_${v.key}`) ?? ""));
    return {
      package_key: key,
      vehicle_key: v.key,
      price_cents: cents ?? 0,
    };
  });

  const { error: priceError } = await ctx.supabase
    .from("catalog_package_prices")
    .upsert(priceRows);

  if (priceError) return { ok: false, message: priceError.message };

  revalidateCatalog();
  return { ok: true, message: `Package “${name}” created.` };
}

export async function updateCatalogPackage(
  packageKey: string,
  _prev: HubCatalogActionState,
  formData: FormData,
): Promise<HubCatalogActionState> {
  void _prev;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const features = parseFeatures(String(formData.get("features") ?? ""));
  const duration_hours = Number.parseFloat(String(formData.get("duration_hours") ?? "2"));
  const featured = String(formData.get("featured") ?? "") === "on";
  const active = String(formData.get("active") ?? "") === "on";
  const sort_order = parseSortOrder(String(formData.get("sort_order") ?? "0"));

  if (!name) return { ok: false, message: "Package name is required." };
  if (!Number.isFinite(duration_hours) || duration_hours <= 0) {
    return { ok: false, message: "Duration must be a positive number of hours." };
  }

  const { error } = await ctx.supabase
    .from("catalog_packages")
    .update({
      name,
      description,
      features,
      duration_hours,
      featured,
      active,
      sort_order,
    })
    .eq("key", packageKey);

  if (error) return { ok: false, message: error.message };

  const priceRows = vehicleKeysForCatalog().map((vehicle_key) => {
    const cents = parseDollarsToCents(String(formData.get(`price_${vehicle_key}`) ?? ""));
    return {
      package_key: packageKey,
      vehicle_key,
      price_cents: cents ?? 0,
    };
  });

  const { error: priceError } = await ctx.supabase
    .from("catalog_package_prices")
    .upsert(priceRows);

  if (priceError) return { ok: false, message: priceError.message };

  revalidateCatalog();
  return { ok: true, message: "Package updated." };
}

export async function deleteCatalogPackage(
  packageKey: string,
  _prev: HubCatalogActionState,
  _formData: FormData,
): Promise<HubCatalogActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase
    .from("catalog_packages")
    .delete()
    .eq("key", packageKey);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23503"
          ? "Cannot delete — this package is referenced by existing bookings. Deactivate it instead."
          : error.message,
    };
  }

  revalidateCatalog();
  return { ok: true, message: "Package removed." };
}

/* ── Add-ons ── */

export async function createCatalogAddon(
  _prev: HubCatalogActionState,
  formData: FormData,
): Promise<HubCatalogActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price_suffix = String(formData.get("price_suffix") ?? "").trim();
  const icon = String(formData.get("icon") ?? "spray");
  const sort_order = parseSortOrder(String(formData.get("sort_order") ?? "0"));
  const price_cents = parseDollarsToCents(String(formData.get("price") ?? ""));

  if (!name) return { ok: false, message: "Add-on name is required." };
  if (price_cents === null) return { ok: false, message: "Enter a valid price." };
  if (!isAddonIcon(icon)) return { ok: false, message: "Invalid icon." };

  const { error } = await ctx.supabase.from("catalog_addons").insert({
    name,
    description,
    price_cents,
    price_suffix,
    icon,
    active: true,
    sort_order,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "An add-on with that name already exists." };
    return { ok: false, message: error.message };
  }

  revalidateCatalog();
  return { ok: true, message: `Add-on “${name}” created.` };
}

export async function updateCatalogAddon(
  addonId: string,
  _prev: HubCatalogActionState,
  formData: FormData,
): Promise<HubCatalogActionState> {
  void _prev;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price_suffix = String(formData.get("price_suffix") ?? "").trim();
  const icon = String(formData.get("icon") ?? "spray");
  const active = String(formData.get("active") ?? "") === "on";
  const sort_order = parseSortOrder(String(formData.get("sort_order") ?? "0"));
  const price_cents = parseDollarsToCents(String(formData.get("price") ?? ""));

  if (!name) return { ok: false, message: "Add-on name is required." };
  if (price_cents === null) return { ok: false, message: "Enter a valid price." };
  if (!isAddonIcon(icon)) return { ok: false, message: "Invalid icon." };

  const { error } = await ctx.supabase
    .from("catalog_addons")
    .update({
      name,
      description,
      price_cents,
      price_suffix,
      icon,
      active,
      sort_order,
    })
    .eq("id", addonId);

  if (error) {
    if (error.code === "23505") return { ok: false, message: "That add-on name is already in use." };
    return { ok: false, message: error.message };
  }

  revalidateCatalog();
  return { ok: true, message: "Add-on updated." };
}

export async function deleteCatalogAddon(
  addonId: string,
  _prev: HubCatalogActionState,
  _formData: FormData,
): Promise<HubCatalogActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase.from("catalog_addons").delete().eq("id", addonId);

  if (error) return { ok: false, message: error.message };

  revalidateCatalog();
  return { ok: true, message: "Add-on removed." };
}

/* ── Location types ── */

export async function createBookingLocationType(
  _prev: HubCatalogActionState,
  formData: FormData,
): Promise<HubCatalogActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const label = String(formData.get("label") ?? "").trim();
  const sort_order = parseSortOrder(String(formData.get("sort_order") ?? "0"));

  if (!label) return { ok: false, message: "Label is required." };

  const { error } = await ctx.supabase.from("booking_location_types").insert({
    label,
    active: true,
    sort_order,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "That location type already exists." };
    return { ok: false, message: error.message };
  }

  revalidateCatalog();
  return { ok: true, message: "Location type added." };
}

export async function updateBookingLocationType(
  locationId: string,
  _prev: HubCatalogActionState,
  formData: FormData,
): Promise<HubCatalogActionState> {
  void _prev;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const label = String(formData.get("label") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "on";
  const sort_order = parseSortOrder(String(formData.get("sort_order") ?? "0"));

  if (!label) return { ok: false, message: "Label is required." };

  const { error } = await ctx.supabase
    .from("booking_location_types")
    .update({ label, active, sort_order })
    .eq("id", locationId);

  if (error) {
    if (error.code === "23505") return { ok: false, message: "That label is already in use." };
    return { ok: false, message: error.message };
  }

  revalidateCatalog();
  return { ok: true, message: "Location type updated." };
}

export async function deleteBookingLocationType(
  locationId: string,
  _prev: HubCatalogActionState,
  _formData: FormData,
): Promise<HubCatalogActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase
    .from("booking_location_types")
    .delete()
    .eq("id", locationId);

  if (error) return { ok: false, message: error.message };

  revalidateCatalog();
  return { ok: true, message: "Location type removed." };
}
