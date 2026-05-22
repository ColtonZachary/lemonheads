import Link from "next/link";

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
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← {access.isManager ? "Settings" : "Schedule"}
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">
        HUB COLORS
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Customize accent, backgrounds, text, and borders for your view of the
        Managers Hub. Changes do not affect the public website or other users.
      </p>

      <div className="mt-10 max-w-4xl">
        {!schemaReady ? <HubThemeMigrationNotice /> : null}
        <HubAppearancePanel savedTheme={savedTheme} schemaReady={schemaReady} />
      </div>
    </div>
  );
}
