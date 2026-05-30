import Link from "next/link";

import { HubPageHeader } from "@/components/hub/hub-page";
import { LoyaltySettingsPanel } from "@/components/hub/loyalty-settings-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchCatalogAddons, fetchCatalogPackages } from "@/lib/hub/catalog-db";
import {
  fetchLoyaltyRewardGoals,
  fetchLoyaltySettings,
  fetchPendingLoyaltyRedemptions,
} from "@/lib/hub/loyalty-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubLoyaltySettingsPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();

  const [settingsResult, goals, pendingRedemptions, packages, addons] = await Promise.all([
    fetchLoyaltySettings(supabase!),
    fetchLoyaltyRewardGoals(supabase!),
    fetchPendingLoyaltyRedemptions(supabase!),
    fetchCatalogPackages(supabase!),
    fetchCatalogAddons(supabase!),
  ]);

  const { schemaReady, ...settings } = settingsResult;

  const catalog = {
    packages: packages.filter((p) => p.active).map((p) => ({ key: p.key, name: p.name })),
    addons: addons.filter((a) => a.active).map((a) => ({ name: a.name })),
  };

  return (
    <div>
      <Link
        href="/hub/settings"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        ← Settings
      </Link>
      <div className="mt-4">
        <HubPageHeader
          title="Loyalty"
          description="Customer points, redeemable goals, and unused redemptions. Checkout rewards link to bookings automatically."
        />
      </div>

      <div className="mt-6 max-w-4xl space-y-6">
        {!schemaReady ? (
          <p className="rounded border border-y/25 bg-y/10 px-4 py-3 font-mono text-xs text-y/90">
            Loyalty tables are not visible to the API yet. In Supabase SQL Editor run:{" "}
            <code className="text-y">NOTIFY pgrst, &apos;reload schema&apos;;</code> then refresh.
          </p>
        ) : null}
        <LoyaltySettingsPanel
          settings={settings}
          goals={goals}
          pendingRedemptions={pendingRedemptions}
          catalog={catalog}
        />
      </div>
    </div>
  );
}
