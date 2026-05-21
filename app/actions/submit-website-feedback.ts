"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const FeedbackSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  feedback: z
    .string()
    .min(10, "Share a bit more about the site (10+ characters).")
    .max(2000, "Please keep feedback under 2000 characters."),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Please rate the website.")
    .max(5),
  email: z
    .string()
    .email("Please enter a valid email.")
    .optional()
    .or(z.literal("")),
  page: z.string().max(500).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export type WebsiteFeedbackSubmitState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    }
  | { status: "success" };

export async function submitWebsiteFeedback(
  _prev: WebsiteFeedbackSubmitState,
  formData: FormData,
): Promise<WebsiteFeedbackSubmitState> {
  const parsed = FeedbackSchema.safeParse({
    name: formData.get("name"),
    feedback: formData.get("feedback"),
    rating: formData.get("rating"),
    email: formData.get("email") ?? "",
    page: formData.get("page") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the form and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    console.log("[website-feedback] would save →", data);
    return { status: "success" };
  }

  const pagePath = data.page.trim().slice(0, 500) || "/";
  const email = data.email?.trim() || null;

  const { error } = await supabase.from("website_feedback").insert({
    submitter_name: data.name.trim(),
    submitter_email: email,
    page_path: pagePath,
    feedback_text: data.feedback.trim(),
    rating: data.rating,
    status: "pending",
  });

  if (error) {
    console.error("[website-feedback] insert failed:", error.message);
    return {
      status: "error",
      message: "We couldn't send your feedback. Please try again in a moment.",
    };
  }

  return { status: "success" };
}
