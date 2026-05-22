"use server";

import { revalidatePath } from "next/cache";

import {
  HUB_THEME_DEFAULTS,
  HUB_THEME_ITEMS,
  isValidHubColor,
  normalizeHubTheme,
  type HubTheme,
  type HubThemeKey,
} from "@/lib/hub/hub-theme";
import { isHubThemeColumnMissing } from "@/lib/hub/hub-theme-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MIGRATION_HINT =
  "Run the hub_theme migration in Supabase (see Hub colors page for SQL).";

export type HubThemeActionState = {
  ok: boolean;
  message: string;
};

const APPEARANCE_PATH = "/hub/settings/appearance";

function revalidateHubTheme() {
  revalidatePath(APPEARANCE_PATH);
  revalidatePath("/hub", "layout");
}

function parseThemeFromForm(formData: FormData): HubTheme | { error: string } {
  const theme: HubTheme = {};
  for (const item of HUB_THEME_ITEMS) {
    const raw = String(formData.get(item.key) ?? "").trim();
    if (!raw) continue;
    if (!isValidHubColor(raw)) {
      return { error: `Invalid color for ${item.label}. Use #hex or rgba(...).` };
    }
    if (raw !== HUB_THEME_DEFAULTS[item.key]) {
      theme[item.key as HubThemeKey] = raw;
    }
  }
  return theme;
}

export async function saveHubTheme(
  _prev: HubThemeActionState,
  formData: FormData,
): Promise<HubThemeActionState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in required." };

  const parsed = parseThemeFromForm(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const { error } = await supabase
    .from("profiles")
    .update({ hub_theme: parsed })
    .eq("id", user.id);

  if (error) {
    if (isHubThemeColumnMissing(error)) {
      return { ok: false, message: MIGRATION_HINT };
    }
    console.error("[hub-theme] save:", error.message);
    return { ok: false, message: error.message };
  }

  revalidateHubTheme();
  return { ok: true, message: "Hub colors saved for your account." };
}

export async function resetHubTheme(
  _prev: HubThemeActionState,
  _formData: FormData,
): Promise<HubThemeActionState> {
  void _formData;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in required." };

  const { error } = await supabase
    .from("profiles")
    .update({ hub_theme: {} })
    .eq("id", user.id);

  if (error) {
    if (isHubThemeColumnMissing(error)) {
      return { ok: false, message: MIGRATION_HINT };
    }
    console.error("[hub-theme] reset:", error.message);
    return { ok: false, message: error.message };
  }

  revalidateHubTheme();
  return { ok: true, message: "Hub colors reset to defaults." };
}

/** Used when loading theme from DB rows */
export { normalizeHubTheme };
