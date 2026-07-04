import Link from "next/link";

import { RewardsDashboard } from "@/components/rewards/rewards-dashboard";
import { RewardsSignIn } from "@/components/rewards/rewards-sign-in";
import { Button } from "@/components/ui/button";
import { signOutRewards } from "@/app/actions/loyalty-customer";
import { fetchCatalogPackages } from "@/lib/hub/catalog-db";
import {
  fetchLoyaltyRewardGoals,
  fetchLoyaltySettings,
} from "@/lib/hub/loyalty-db";
import { linkCustomerAuthUser } from "@/lib/loyalty/link-customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Rewards",
  description: "Earn points on every detail and redeem free packages or add-ons.",
};

export default async function RewardsPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-2xl px-[5%] py-20">
        <h1 className="font-display text-5xl tracking-[0.04em] text-y">REWARDS</h1>
        <p className="mt-4 text-sm text-text/50">Rewards are not configured yet.</p>
      </main>
    );
  }

  const [settingsResult, goals, packages] = await Promise.all([
    fetchLoyaltySettings(supabase),
    fetchLoyaltyRewardGoals(supabase, { activeOnly: true }),
    fetchCatalogPackages(supabase),
  ]);

  const { schemaReady, ...settings } = settingsResult;
  const packageNames = Object.fromEntries(packages.map((p) => [p.key, p.name]));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance = 0;
  let linked = false;

  if (user) {
    await linkCustomerAuthUser(supabase);
    const { data: customer } = await supabase
      .from("customers")
      .select("points_balance, display_name, email")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (customer) {
      linked = true;
      balance = customer.points_balance ?? 0;
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-[5%] py-16 md:py-24">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-y/60">
        {SITE.shortName} Rewards
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-[0.04em] text-y md:text-6xl">
        REWARDS
      </h1>
      <p className="mt-3 text-sm text-text/50">
        Book anytime — no account required. Sign in to track points and redeem free services after
        your details are billed.
      </p>

      <div className="mt-10 space-y-8">
        {!schemaReady ? (
          <p className="rounded border border-y/25 bg-y/10 px-4 py-3 font-mono text-xs text-y/90">
            Loyalty tables are still syncing. In Supabase SQL Editor run:{" "}
            <code className="text-y">NOTIFY pgrst, &apos;reload schema&apos;;</code> then refresh
            this page.
          </p>
        ) : null}
        {user && linked ? (
          <>
            <RewardsDashboard
              balance={balance}
              settings={settings}
              goals={goals}
              packageNames={packageNames}
              programDisabled={!settings.enabled}
            />
            <form action={signOutRewards} className="pt-2">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </>
        ) : user && !linked ? (
          <div className="rounded-md border border-white/15 bg-card p-6 text-sm text-text/55">
            <p>
              Signed in as <span className="text-y">{user.email}</span>, but we couldn&apos;t find a
              rewards account linked to this login. The customer email must match, and{" "}
              <code className="text-y/80">auth_user_id</code> must be your Auth user id.
            </p>
            <form action={signOutRewards} className="mt-4">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <>
            {!settings.enabled ? (
              <p className="rounded border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text/45">
                The rewards program is coming soon.
              </p>
            ) : (
              <div className="rounded-md border border-white/10 bg-card/50 p-5">
                <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-y/80">
                  How it works
                </h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-text/50">
                  <li>
                    Earn {settings.points_per_dollar} point
                    {settings.points_per_dollar === 1 ? "" : "s"} per $1 on billed details (not
                    when a promo code is used)
                  </li>
                  <li>Multiple rewards to choose from — pick the goal you want</li>
                  <li>Optional sign-in to view balance and redeem</li>
                </ul>
                {goals.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    {goals.map((g) => (
                      <li key={g.id} className="flex justify-between gap-2 text-sm">
                        <span className="text-text/70">{g.title}</span>
                        <span className="shrink-0 font-mono text-y/80">{g.points_required} pts</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
            <RewardsSignIn />
          </>
        )}

        <div className="border-t border-white/10 pt-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/book">Book a detail</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
