import Link from "next/link";

import { HubPageHeader } from "@/components/hub/hub-page";
import { HubAppearancePanel } from "@/components/hub/hub-appearance-panel";
import { HubThemeMigrationNotice } from "@/components/hub/hub-theme-migration-notice";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchHubThemeForProfile } from "@/lib/hub/hub-theme-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubAppearancePage() {
  const access = await requireHubAccess();
  const supabase = await createSupabaseServerClient();
  const { theme: savedTheme, schemaReady } = await fetchHubThemeForProfile(
    supabase!,
    access.profile.id,
  );

  return (
    <div>
      <Link
        href={access.isManager ? "/hub/settings" : "/hub/calendar"}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        ← {access.isManager ? "Settings" : "Schedule"}
      </Link>

      <div className="mt-4">
        <HubPageHeader
          title="Hub colors"
          description="Personal theme for your hub view only — does not affect the public site or other users."
        />
      </div>

      <div className="mt-6 max-w-4xl">
        {!schemaReady ? <HubThemeMigrationNotice /> : null}
        <HubAppearancePanel savedTheme={savedTheme} schemaReady={schemaReady} />
      </div>
    </div>
  );
}
