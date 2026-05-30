import Link from "next/link";

import { DetailChecklistSettingsPanel } from "@/components/hub/detail-checklist-settings-panel";
import { HubPageHeader } from "@/components/hub/hub-page";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchDetailChecklistItems } from "@/lib/hub/detail-checklist-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubChecklistSettingsPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const items = await fetchDetailChecklistItems(supabase!);

  return (
    <div>
      <Link
        href="/hub/settings"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        ← Settings
      </Link>
      <HubPageHeader
        className="mt-4"
        title="Checklist"
        description="Items detailers confirm after each job in the mobile app."
      />
      <div className="mt-6 max-w-2xl">
        <DetailChecklistSettingsPanel items={items} />
      </div>
    </div>
  );
}
