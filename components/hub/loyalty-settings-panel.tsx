"use client";

import { useActionState } from "react";

import {
  cancelLoyaltyRedemption,
  createLoyaltyGoal,
  deleteLoyaltyGoal,
  updateLoyaltyGoal,
  updateLoyaltySettings,
  type HubLoyaltyActionState,
} from "@/app/actions/hub-loyalty";
import { Button } from "@/components/ui/button";
import {
  formatRewardGoalDetail,
  type LoyaltyRedemptionRow,
  type LoyaltyRewardGoalRow,
  type LoyaltySettingsRow,
} from "@/lib/hub/loyalty-db";
import { cn } from "@/lib/utils";

const EMPTY: HubLoyaltyActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export type LoyaltyCatalogOptions = {
  packages: { key: string; name: string }[];
  addons: { name: string }[];
};

function RewardKindFields({
  packages,
  addons,
  defaultKind,
  defaultPackageKey,
  defaultAddonName,
}: {
  packages: LoyaltyCatalogOptions["packages"];
  addons: LoyaltyCatalogOptions["addons"];
  defaultKind?: "package" | "addon";
  defaultPackageKey?: string;
  defaultAddonName?: string;
}) {
  return (
    <>
      <label className="block sm:col-span-2">
        <span className={labelClass}>Reward type *</span>
        <select name="reward_kind" defaultValue={defaultKind ?? "package"} className={fieldClass}>
          <option value="package">Free package</option>
          <option value="addon">Free add-on</option>
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={labelClass}>Package</span>
        <select
          name="reward_package_key"
          defaultValue={defaultPackageKey ?? ""}
          className={fieldClass}
        >
          <option value="">Select package…</option>
          {packages.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={labelClass}>Add-on</span>
        <select
          name="reward_addon_name"
          defaultValue={defaultAddonName ?? ""}
          className={fieldClass}
        >
          <option value="">Select add-on…</option>
          {addons.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function GoalEditForm({
  goal,
  packageNames,
  catalog,
}: {
  goal: LoyaltyRewardGoalRow;
  packageNames: Record<string, string>;
  catalog: LoyaltyCatalogOptions;
}) {
  const [state, action, pending] = useActionState(updateLoyaltyGoal, EMPTY);

  return (
    <form action={action} className="mt-3 space-y-3 rounded border border-white/10 bg-dk/40 p-4">
      <input type="hidden" name="goal_id" value={goal.id} />
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-y/70">Edit goal</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Title *</span>
          <input name="title" defaultValue={goal.title} required className={fieldClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Description</span>
          <input name="description" defaultValue={goal.description} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Points required *</span>
          <input
            name="points_required"
            type="number"
            min={1}
            defaultValue={goal.points_required}
            required
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Sort order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={goal.sort_order}
            className={fieldClass}
          />
        </label>
        <RewardKindFields
          packages={catalog.packages}
          addons={catalog.addons}
          defaultKind={goal.reward_kind}
          defaultPackageKey={goal.reward_package_key ?? undefined}
          defaultAddonName={goal.reward_addon_name ?? undefined}
        />
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" name="active" defaultChecked={goal.active} className="rounded" />
          <span className={labelClass}>Active</span>
        </label>
      </div>
      <p className="text-xs text-text/45">{formatRewardGoalDetail(goal, packageNames)}</p>
      {state.message ? (
        <p className={cn("text-xs", state.ok ? "text-y/80" : "text-red-300")}>{state.message}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save goal"}
      </Button>
    </form>
  );
}

export function LoyaltySettingsPanel({
  settings,
  goals,
  pendingRedemptions,
  catalog,
}: {
  settings: LoyaltySettingsRow;
  goals: LoyaltyRewardGoalRow[];
  pendingRedemptions: LoyaltyRedemptionRow[];
  catalog: LoyaltyCatalogOptions;
}) {
  const [settingsState, settingsAction, settingsPending] = useActionState(
    updateLoyaltySettings,
    EMPTY,
  );
  const [createState, createAction, createPending] = useActionState(createLoyaltyGoal, EMPTY);

  const packageNames = Object.fromEntries(catalog.packages.map((p) => [p.key, p.name]));

  return (
    <div className="space-y-10">
      <section className="rounded-lg border border-white/10 p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-y">Program settings</h2>
        <p className="mt-1 text-sm text-text/45">
          Points are awarded when a booking is marked billed in the hub. Customers earn optional
          rewards — login is not required to book.
        </p>
        <form action={settingsAction} className="mt-4 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              className="rounded"
            />
            <span className={labelClass}>Loyalty program enabled</span>
          </label>
          <label className="block max-w-xs">
            <span className={labelClass}>Points per $1 spent</span>
            <input
              name="points_per_dollar"
              type="number"
              step="0.01"
              min={0}
              defaultValue={settings.points_per_dollar}
              className={fieldClass}
            />
          </label>
          {settingsState.message ? (
            <p
              className={cn("text-xs", settingsState.ok ? "text-y/80" : "text-red-300")}
            >
              {settingsState.message}
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={settingsPending}>
            {settingsPending ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </section>

      {pendingRedemptions.length > 0 ? (
        <section className="rounded-lg border border-y/20 bg-y/[0.04] p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-y">
            Unused redemptions
          </h2>
          <p className="mt-1 text-sm text-text/45">
            Redeemed on the rewards page but not yet applied to a booking. Rewards applied at
            checkout are linked automatically — no manager approval needed.
          </p>
          <ul className="mt-3 space-y-2">
            {pendingRedemptions.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/10 bg-dk/50 px-3 py-2"
              >
                <div className="text-sm">
                  <span className="text-y">{r.goal_title ?? "Reward"}</span>
                  <span className="text-text/45"> · {r.points_spent} pts</span>
                  <div className="font-mono text-[10px] text-text/40">
                    {r.customer_name || "Customer"} · {r.customer_email}
                  </div>
                </div>
                <PendingRedemptionAction
                  redemptionId={r.id}
                  action={cancelLoyaltyRedemption}
                  label="Cancel & refund"
                  variant="ghost"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-y">Reward goals</h2>
        <p className="mt-1 text-sm text-text/45">
          Add multiple goals with different point thresholds. Customers redeem on the public rewards
          page when signed in.
        </p>

        <ul className="mt-4 space-y-4">
          {goals.map((goal) => (
            <li key={goal.id} className="rounded-lg border border-white/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-y">{goal.title}</span>
                    {!goal.active ? (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-text/50">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-text/50">
                    {goal.points_required} points ·{" "}
                    {formatRewardGoalDetail(goal, packageNames)}
                  </p>
                  {goal.description ? (
                    <p className="mt-1 text-xs text-text/40">{goal.description}</p>
                  ) : null}
                </div>
                <DeleteGoalButton goalId={goal.id} />
              </div>
              <GoalEditForm goal={goal} packageNames={packageNames} catalog={catalog} />
            </li>
          ))}
        </ul>

        <form action={createAction} className="mt-6 space-y-3 rounded-lg border border-dashed border-white/15 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-y/70">Add goal</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Title *</span>
              <input name="title" required placeholder="e.g. Free Gold wash" className={fieldClass} />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Description</span>
              <input name="description" className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Points required *</span>
              <input
                name="points_required"
                type="number"
                min={1}
                required
                placeholder="500"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Sort order</span>
              <input name="sort_order" type="number" defaultValue={0} className={fieldClass} />
            </label>
            <RewardKindFields packages={catalog.packages} addons={catalog.addons} />
            <label className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" name="active" defaultChecked className="rounded" />
              <span className={labelClass}>Active</span>
            </label>
          </div>
          {createState.message ? (
            <p className={cn("text-xs", createState.ok ? "text-y/80" : "text-red-300")}>
              {createState.message}
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={createPending}>
            {createPending ? "Adding…" : "Add goal"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function DeleteGoalButton({ goalId }: { goalId: string }) {
  const [state, action, pending] = useActionState(deleteLoyaltyGoal, EMPTY);

  return (
    <form action={action}>
      <input type="hidden" name="goal_id" value={goalId} />
      <Button type="submit" size="sm" variant="ghost" className="text-red-300/80" disabled={pending}>
        {pending ? "…" : "Delete"}
      </Button>
      {state.message && !state.ok ? (
        <span className="sr-only">{state.message}</span>
      ) : null}
    </form>
  );
}

function PendingRedemptionAction({
  redemptionId,
  action,
  label,
  variant = "primary",
}: {
  redemptionId: string;
  action: (
    prev: HubLoyaltyActionState,
    formData: FormData,
  ) => Promise<HubLoyaltyActionState>;
  label: string;
  variant?: "primary" | "ghost";
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  return (
    <form action={formAction}>
      <input type="hidden" name="redemption_id" value={redemptionId} />
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "…" : label}
      </Button>
      {state.message && !state.ok ? (
        <span className="sr-only">{state.message}</span>
      ) : null}
    </form>
  );
}
