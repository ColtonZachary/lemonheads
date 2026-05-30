import Link from "next/link";

import { HubPageHeader } from "@/components/hub/hub-page";
import { DetailerPayRatesPanel } from "@/components/hub/detailer-pay-rates-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchPayRatesForEditor } from "@/lib/hub/detailer-pay-rates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubSettingsPayRatesPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const { packages, addons } = await fetchPayRatesForEditor(supabase!);

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
          title="Pay rates"
          description="Detailer pay per package and add-on (Regular vs Senior). Used in Reports and My pay — not customer prices."
        />
      </div>

      <div className="mt-6 max-w-4xl">
        <DetailerPayRatesPanel packages={packages} addons={addons} />
      </div>
    </div>
  );
}
