"use client";

import { useActionState } from "react";

import {
  redeemLoyaltyGoal,
  type LoyaltyCustomerActionState,
} from "@/app/actions/loyalty-customer";
import { Button } from "@/components/ui/button";
import {
  formatRewardGoalDetail,
  type LoyaltyRewardGoalRow,
  type LoyaltySettingsRow,
} from "@/lib/hub/loyalty-db";
import { cn } from "@/lib/utils";

const EMPTY: LoyaltyCustomerActionState = { ok: false, message: "" };

function GoalRedeemButton({
  goal,
  balance,
  disabled,
}: {
  goal: LoyaltyRewardGoalRow;
  balance: number;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(redeemLoyaltyGoal, EMPTY);
  const canRedeem = balance >= goal.points_required && !disabled;

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="goal_id" value={goal.id} />
      <Button type="submit" size="sm" disabled={!canRedeem || pending}>
        {pending ? "Redeeming…" : canRedeem ? "Redeem" : `Need ${goal.points_required - balance} more pts`}
      </Button>
      {state.message ? (
        <p className={cn("mt-2 text-xs", state.ok ? "text-y/80" : "text-red-300")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function RewardsDashboard({
  balance,
  settings,
  goals,
  packageNames,
  programDisabled,
}: {
  balance: number;
  settings: LoyaltySettingsRow;
  goals: LoyaltyRewardGoalRow[];
  packageNames: Record<string, string>;
  programDisabled: boolean;
}) {
  const activeGoals = goals.filter((g) => g.active);

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-y/25 bg-y/[0.06] p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-text/45">
          Your balance
        </p>
        <p className="font-display text-6xl tracking-[0.02em] text-y">{balance}</p>
        <p className="mt-2 text-sm text-text/50">
          {settings.enabled && !programDisabled ? (
            <>
              Earn {settings.points_per_dollar} point
              {settings.points_per_dollar === 1 ? "" : "s"} per $1 spent on completed, billed
              details.
            </>
          ) : (
            <>The rewards program is paused. Your balance is saved.</>
          )}
        </p>
      </div>

      <section>
        <h2 className="font-display text-3xl tracking-[0.04em] text-y">Rewards goals</h2>
        <p className="mt-1 text-sm text-text/45">
          Work toward any goal below. Redeem when you have enough points — our team will apply your
          free package or add-on on your next visit.
        </p>

        {activeGoals.length === 0 ? (
          <p className="mt-4 font-mono text-sm text-text/40">No active rewards yet. Check back soon.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {activeGoals.map((goal) => {
              const progress = Math.min(100, Math.round((balance / goal.points_required) * 100));
              const detail = formatRewardGoalDetail(goal, packageNames);

              return (
                <li
                  key={goal.id}
                  className="rounded-md border border-white/10 bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-mono text-sm uppercase tracking-[0.08em] text-y">
                        {goal.title}
                      </h3>
                      <p className="mt-1 text-sm text-text/55">{detail}</p>
                      {goal.description ? (
                        <p className="mt-1 text-xs text-text/40">{goal.description}</p>
                      ) : null}
                    </div>
                    <span className="font-mono text-lg text-y">{goal.points_required} pts</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-y transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-text/40">
                    {balance} / {goal.points_required} points
                  </p>
                  {!programDisabled && settings.enabled ? (
                    <GoalRedeemButton
                      goal={goal}
                      balance={balance}
                      disabled={programDisabled}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
