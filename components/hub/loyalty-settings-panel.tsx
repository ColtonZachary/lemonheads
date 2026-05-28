"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

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
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

function feedbackClass(ok: boolean) {
  return cn(
    "mt-3 rounded border px-3 py-2 font-mono text-[10px]",
    ok ? "border-y/30 bg-y/10 text-y" : "border-red-500/30 bg-red-500/10 text-red-200",
  );
}

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
  catalog,
}: {
  goal: LoyaltyRewardGoalRow;
  catalog: LoyaltyCatalogOptions;
}) {
  const [state, action, pending] = useActionState(updateLoyaltyGoal, EMPTY);

  return (
    <form
      action={action}
      className="border-t border-white/10 bg-white/[0.02] px-3 py-3 sm:px-4"
    >
      <input type="hidden" name="goal_id" value={goal.id} />
      <div className="grid gap-2.5 sm:grid-cols-2">
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
        <label className="flex items-end gap-1.5 pb-0.5 text-xs sm:col-span-2">
          <input type="checkbox" name="active" defaultChecked={goal.active} className="size-3.5" />
          Active
        </label>
      </div>
      {state.message ? <p className={feedbackClass(state.ok)}>{state.message}</p> : null}
      <Button type="submit" className="mt-3 h-auto min-h-0 px-3 py-1.5 text-xs" disabled={pending}>
        {pending ? "Saving…" : "Save goal"}
      </Button>
    </form>
  );
}

function GoalListRow({
  goal,
  packageNames,
  catalog,
  expanded,
  onToggleEdit,
}: {
  goal: LoyaltyRewardGoalRow;
  packageNames: Record<string, string>;
  catalog: LoyaltyCatalogOptions;
  expanded: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <li className="rounded-lg border border-white/10">
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm text-y/90">{goal.title}</span>
            {!goal.active ? (
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[8px] uppercase text-text/50">
                Inactive
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 font-mono text-[9px] text-text/45">
            {goal.points_required} pts · {formatRewardGoalDetail(goal, packageNames)}
          </p>
          {goal.description ? (
            <p className="mt-0.5 truncate text-[10px] text-text/40">{goal.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DeleteGoalButton goalId={goal.id} />
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-0 px-2 py-1 text-[10px]"
            onClick={onToggleEdit}
          >
            {expanded ? "Close" : "Edit"}
          </Button>
        </div>
      </div>
      {expanded ? <GoalEditForm goal={goal} catalog={catalog} /> : null}
    </li>
  );
}

function DeleteGoalButton({ goalId }: { goalId: string }) {
  const [state, action, pending] = useActionState(deleteLoyaltyGoal, EMPTY);

  return (
    <form action={action}>
      <input type="hidden" name="goal_id" value={goalId} />
      <Button
        type="submit"
        variant="outline"
        className="h-auto min-h-0 border-red-500/30 px-2 py-1 text-[10px] text-red-200"
        disabled={pending}
      >
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
}: {
  redemptionId: string;
  action: (
    prev: HubLoyaltyActionState,
    formData: FormData,
  ) => Promise<HubLoyaltyActionState>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  return (
    <form action={formAction}>
      <input type="hidden" name="redemption_id" value={redemptionId} />
      <Button
        type="submit"
        variant="outline"
        className="h-auto min-h-0 px-2 py-1 text-[10px]"
        disabled={pending}
      >
        {pending ? "…" : label}
      </Button>
      {state.message && !state.ok ? (
        <span className="sr-only">{state.message}</span>
      ) : null}
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
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const packageNames = Object.fromEntries(catalog.packages.map((p) => [p.key, p.name]));
  const activeGoals = goals.filter((g) => g.active).length;

  const toggleGoalEdit = (id: string) => {
    setExpandedGoalId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Reward goals
          </p>
          <p className="font-display text-2xl text-y">{goals.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Active goals
          </p>
          <p className="font-display text-2xl text-y">{activeGoals}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Unused redemptions
          </p>
          <p className="font-display text-2xl text-y">{pendingRedemptions.length}</p>
        </div>
      </div>

      <section className="rounded-lg border border-white/10 px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Program settings
          </h2>
          <Link
            href="/rewards"
            className="font-mono text-[9px] text-y/60 hover:text-y"
          >
            Public /rewards →
          </Link>
        </div>
        <p className="text-xs text-text/45">
          Points on billed jobs (not with promo codes). Checkout rewards link automatically.
        </p>
        <form action={settingsAction} className="mt-4 space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={settings.enabled}
                className="size-3.5 rounded"
              />
              <span className={labelClass}>Program enabled</span>
            </label>
            <label className="block max-w-[8rem]">
              <span className={labelClass}>Points per $1</span>
              <input
                name="points_per_dollar"
                type="number"
                step="0.01"
                min={0}
                defaultValue={settings.points_per_dollar}
                className={fieldClass}
              />
            </label>
          </div>
          {settingsState.message ? (
            <p className={feedbackClass(settingsState.ok)}>{settingsState.message}</p>
          ) : null}
          <Button
            type="submit"
            className="h-auto min-h-0 px-3 py-1.5 text-xs"
            disabled={settingsPending}
          >
            {settingsPending ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </section>

      {pendingRedemptions.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              Unused redemptions
            </h2>
            <span className="font-mono text-[9px] text-text/35">Redeemed, not on a booking</span>
          </div>
          <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-y/20 bg-y/[0.03]">
            {pendingRedemptions.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2 last:border-0"
              >
                <div className="min-w-0 text-sm">
                  <span className="text-y/90">{r.goal_title ?? "Reward"}</span>
                  <span className="text-text/45"> · {r.points_spent} pts</span>
                  <p className="truncate font-mono text-[9px] text-text/40">
                    {r.customer_name || "Customer"} · {r.customer_email}
                  </p>
                </div>
                <PendingRedemptionAction
                  redemptionId={r.id}
                  action={cancelLoyaltyRedemption}
                  label="Cancel & refund"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Reward goals
          </h2>
          <span className="font-mono text-[9px] text-text/35">Tap Edit to change a goal</span>
        </div>
        {!goals.length ? (
          <p className="rounded-lg border border-white/10 px-4 py-6 text-sm text-text/40">
            No goals yet. Add one below.
          </p>
        ) : (
          <ul className="space-y-2">
            {goals.map((goal) => (
              <GoalListRow
                key={goal.id}
                goal={goal}
                packageNames={packageNames}
                catalog={catalog}
                expanded={expandedGoalId === goal.id}
                onToggleEdit={() => toggleGoalEdit(goal.id)}
              />
            ))}
          </ul>
        )}

        <details className="mt-4 rounded-lg border border-white/10 bg-card/30">
          <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-y [&::-webkit-details-marker]:hidden">
            + Add reward goal
          </summary>
          <form action={createAction} className="border-t border-white/10 px-4 py-4">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelClass}>Title *</span>
                <input
                  name="title"
                  required
                  placeholder="e.g. Free Gold wash"
                  className={fieldClass}
                />
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
              <label className="flex items-end gap-1.5 pb-0.5 text-xs sm:col-span-2">
                <input type="checkbox" name="active" defaultChecked className="size-3.5" />
                Active
              </label>
            </div>
            <Button
              type="submit"
              className="mt-4 h-auto min-h-0 px-4 py-2 text-xs"
              disabled={createPending}
            >
              {createPending ? "Adding…" : "Add goal"}
            </Button>
            {createState.message ? (
              <p className={feedbackClass(createState.ok)}>{createState.message}</p>
            ) : null}
          </form>
        </details>
      </section>
    </div>
  );
}
