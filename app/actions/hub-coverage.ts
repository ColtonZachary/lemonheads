"use server";

import { revalidatePath } from "next/cache";

import { normalizeCity, normalizeZip } from "@/lib/bookings/service-area-coverage";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";

export type HubCoverageActionState = {
  ok: boolean;
  message: string;
};

const COVERAGE_PATH = "/hub/settings/coverage";

export async function addCoverageRule(
  _prev: HubCoverageActionState,
  formData: FormData,
): Promise<HubCoverageActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const serviceAreaSlug = String(formData.get("service_area_slug") ?? "").trim();
  const ruleType = String(formData.get("rule_type") ?? "zip");
  const value = String(formData.get("value") ?? "").trim();

  if (!serviceAreaSlug) {
    return { ok: false, message: "Select a service area." };
  }

  let zip_prefix: string | null = null;
  let city_name: string | null = null;

  if (ruleType === "city") {
    if (!value) return { ok: false, message: "Enter a city name." };
    city_name = value;
  } else {
    const prefix = normalizeZip(value).slice(0, 5);
    if (prefix.length < 3) {
      return { ok: false, message: "ZIP prefix must be at least 3 digits (e.g. 731 for OKC)." };
    }
    zip_prefix = prefix;
  }

  const { error } = await ctx.supabase.from("service_area_coverage").insert({
    service_area_slug: serviceAreaSlug,
    zip_prefix,
    city_name,
    active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "That rule already exists for this area." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(COVERAGE_PATH);
  return { ok: true, message: "Coverage rule added." };
}

export async function deleteCoverageRule(
  ruleId: string,
  _prev: HubCoverageActionState,
  _formData: FormData,
): Promise<HubCoverageActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase
    .from("service_area_coverage")
    .delete()
    .eq("id", ruleId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(COVERAGE_PATH);
  return { ok: true, message: "Rule removed." };
}

export async function updateServiceAreaTravelMinutes(
  _prev: HubCoverageActionState,
  formData: FormData,
): Promise<HubCoverageActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const slug = String(formData.get("slug") ?? "").trim();
  const minutes = Number.parseInt(String(formData.get("travel_minutes") ?? ""), 10);

  if (!slug) return { ok: false, message: "Missing service area." };
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 600) {
    return { ok: false, message: "Travel minutes must be 0–600." };
  }

  const { error } = await ctx.supabase
    .from("service_areas")
    .update({ travel_minutes_from_shop: minutes })
    .eq("slug", slug);

  if (error) return { ok: false, message: error.message };

  revalidatePath(COVERAGE_PATH);
  revalidatePath("/book");
  return { ok: true, message: "Travel time updated." };
}
