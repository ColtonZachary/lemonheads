"use server";

import { revalidatePath } from "next/cache";

import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";

export type HubWebsiteFeedbackActionState = {
  ok: boolean;
  message: string;
};

const FEEDBACK_PATH = "/hub/website-feedback";

function revalidateFeedback() {
  revalidatePath(FEEDBACK_PATH);
}

export async function markWebsiteFeedbackReviewed(
  _prev: HubWebsiteFeedbackActionState,
  formData: FormData,
): Promise<HubWebsiteFeedbackActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Missing feedback id." };

  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase
    .from("website_feedback")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: ctx.profile.id,
    })
    .eq("id", id);

  if (error) {
    console.error("[hub-website-feedback] reviewed:", error.message);
    return { ok: false, message: error.message };
  }

  revalidateFeedback();
  return { ok: true, message: "Marked as reviewed." };
}

export async function dismissWebsiteFeedback(
  _prev: HubWebsiteFeedbackActionState,
  formData: FormData,
): Promise<HubWebsiteFeedbackActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Missing feedback id." };

  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase
    .from("website_feedback")
    .update({
      status: "dismissed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: ctx.profile.id,
    })
    .eq("id", id);

  if (error) {
    console.error("[hub-website-feedback] dismiss:", error.message);
    return { ok: false, message: error.message };
  }

  revalidateFeedback();
  return { ok: true, message: "Feedback dismissed." };
}

export async function deleteWebsiteFeedback(
  _prev: HubWebsiteFeedbackActionState,
  formData: FormData,
): Promise<HubWebsiteFeedbackActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Missing feedback id." };

  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase
    .from("website_feedback")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[hub-website-feedback] delete:", error.message);
    return { ok: false, message: error.message };
  }

  revalidateFeedback();
  return { ok: true, message: "Feedback deleted." };
}
