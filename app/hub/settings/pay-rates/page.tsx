import Link from "next/link";

import { DetailerPayRatesPanel } from "@/components/hub/detailer-pay-rates-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchPayRatesForEditor } from "@/lib/hub/detailer-pay-rates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubSettingsPayRatesPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const { packages, addons } = await fetchPayRatesForEditor(supabase!);

  return (
    <div className="max-w-4xl">
      <Link
        href="/hub/settings"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Settings
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">
        PAY RATES
      </h1>
      <p className="mt-2 text-sm text-text/45">
        What detailers earn per package and add-on (Regular vs Senior). Used in
        Reports and My pay — not customer prices.
      </p>

      <div className="mt-6">
        <DetailerPayRatesPanel packages={packages} addons={addons} />
      </div>
    </div>
  );
}
