import { WebsiteFeedbackPanel } from "@/components/hub/website-feedback-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchWebsiteFeedbackForHub } from "@/lib/feedback/website-feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubWebsiteFeedbackPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const rows = await fetchWebsiteFeedbackForHub(supabase!);

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">
        WEBSITE FEEDBACK
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Comments from visitors about this website — navigation, booking flow,
        clarity, and bugs. Not service reviews or detail appointments.
      </p>
      {pendingCount > 0 && (
        <p className="mt-3 font-mono text-xs text-y/80">
          {pendingCount} new submission{pendingCount === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-10">
        <WebsiteFeedbackPanel rows={rows} />
      </div>
    </div>
  );
}
