import { HubPageHeader } from "@/components/hub/hub-page";
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
      <HubPageHeader
        title="Website feedback"
        description="Comments from visitors about this website — navigation, booking flow, clarity, and bugs. Not service reviews or detail appointments."
      />
      {pendingCount > 0 && (
        <p className="mt-3 font-mono text-xs text-primary">
          {pendingCount} new submission{pendingCount === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-10">
        <WebsiteFeedbackPanel rows={rows} />
      </div>
    </div>
  );
}
