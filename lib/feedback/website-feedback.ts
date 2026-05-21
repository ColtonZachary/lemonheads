import type { SupabaseClient } from "@supabase/supabase-js";

export type WebsiteFeedbackStatus = "pending" | "reviewed" | "dismissed";

export type WebsiteFeedbackRow = {
  id: string;
  submitter_name: string;
  submitter_email: string | null;
  page_path: string;
  rating: number;
  feedback_text: string;
  status: WebsiteFeedbackStatus;
  created_at: string;
  reviewed_at: string | null;
};

export function formatSiteExperienceRating(rating: number): string {
  const n = Math.min(5, Math.max(1, Math.round(rating)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export async function fetchWebsiteFeedbackForHub(
  client: SupabaseClient,
): Promise<WebsiteFeedbackRow[]> {
  const { data, error } = await client
    .from("website_feedback")
    .select(
      "id, submitter_name, submitter_email, page_path, rating, feedback_text, status, created_at, reviewed_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[website-feedback] hub fetch:", error.message);
    return [];
  }

  const rows = (data ?? []) as WebsiteFeedbackRow[];
  const statusRank: Record<WebsiteFeedbackStatus, number> = {
    pending: 0,
    reviewed: 1,
    dismissed: 2,
  };
  return rows.sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
