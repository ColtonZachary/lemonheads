import { z } from "zod";

import { SITE } from "@/lib/site";

export type WebsiteFeedbackSubmitState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    }
  | { status: "success" };

const FeedbackSchema = z.object({
  name: z.string().min(2),
  feedback: z.string().min(10).max(2000),
  rating: z.coerce.number().int().min(1).max(5),
  email: z.string().email().optional().or(z.literal("")),
  page: z.string().max(500).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

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

  const d = parsed.data;
  const subject = encodeURIComponent(`Website feedback from ${d.name}`);
  const body = encodeURIComponent(
    `Name: ${d.name}\nPage: ${d.page || "/"}\nSite rating: ${d.rating}/5\nEmail: ${d.email || "—"}\n\n${d.feedback}`,
  );
  const mailto = `mailto:${SITE.email.info}?subject=${subject}&body=${body}`;

  if (typeof window !== "undefined") {
    window.open(mailto, "_blank", "noopener,noreferrer");
  }

  return { status: "success" };
}
