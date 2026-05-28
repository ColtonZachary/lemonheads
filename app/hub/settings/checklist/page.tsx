import Link from "next/link";

import { DetailChecklistSettingsPanel } from "@/components/hub/detail-checklist-settings-panel";
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
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Settings
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">CHECKLIST</h1>
      <p className="mt-2 text-sm text-text/45">
        Items detailers confirm after each job in the mobile app.
      </p>
      <div className="mt-6 max-w-2xl">
        <DetailChecklistSettingsPanel items={items} />
      </div>
    </div>
  );
}
