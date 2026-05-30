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
import {
  HubActionAlert,
  HubDetailsSection,
  HubStatCard,
} from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubFormSection,
  HubInput,
  HubNativeSelect,
} from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatRewardGoalDetail,
  type LoyaltyRedemptionRow,
  type LoyaltyRewardGoalRow,
  type LoyaltySettingsRow,
} from "@/lib/hub/loyalty-db";
const EMPTY: HubLoyaltyActionState = { ok: false, message: "" };

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
      <HubFormField label="Reward type" htmlFor="reward_kind" className="sm:col-span-2" required>
        <HubNativeSelect id="reward_kind" name="reward_kind" defaultValue={defaultKind ?? "package"}>
          <option value="package">Free package</option>
          <option value="addon">Free add-on</option>
        </HubNativeSelect>
      </HubFormField>
      <HubFormField label="Package" htmlFor="reward_package_key" className="sm:col-span-2">
        <HubNativeSelect
          id="reward_package_key"
          name="reward_package_key"
          defaultValue={defaultPackageKey ?? ""}
        >
          <option value="">Select package…</option>
          {packages.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </HubNativeSelect>
      </HubFormField>
      <HubFormField label="Add-on" htmlFor="reward_addon_name" className="sm:col-span-2">
        <HubNativeSelect
          id="reward_addon_name"
          name="reward_addon_name"
          defaultValue={defaultAddonName ?? ""}
        >
          <option value="">Select add-on…</option>
          {addons.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name}
            </option>
          ))}
        </HubNativeSelect>
      </HubFormField>
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
      className="border-t border-border bg-muted/20 px-3 py-3 sm:px-4"
    >
      <input type="hidden" name="goal_id" value={goal.id} />
      <HubFieldRow className="gap-2.5">
        <HubFormField label="Title" htmlFor={`edit-title-${goal.id}`} className="sm:col-span-2" required>
          <HubInput id={`edit-title-${goal.id}`} name="title" defaultValue={goal.title} required />
        </HubFormField>
        <HubFormField label="Description" htmlFor={`edit-desc-${goal.id}`} className="sm:col-span-2">
          <HubInput id={`edit-desc-${goal.id}`} name="description" defaultValue={goal.description} />
        </HubFormField>
        <HubFormField label="Points required" htmlFor={`edit-pts-${goal.id}`} required>
          <HubInput
            id={`edit-pts-${goal.id}`}
            name="points_required"
            type="number"
            min={1}
            defaultValue={goal.points_required}
            required
          />
        </HubFormField>
        <HubFormField label="Sort order" htmlFor={`edit-sort-${goal.id}`}>
          <HubInput
            id={`edit-sort-${goal.id}`}
            name="sort_order"
            type="number"
            defaultValue={goal.sort_order}
          />
        </HubFormField>
        <RewardKindFields
          packages={catalog.packages}
          addons={catalog.addons}
          defaultKind={goal.reward_kind}
          defaultPackageKey={goal.reward_package_key ?? undefined}
          defaultAddonName={goal.reward_addon_name ?? undefined}
        />
        <label className="flex items-end gap-1.5 pb-0.5 text-xs sm:col-span-2">
          <input type="checkbox" name="active" defaultChecked={goal.active} className="size-3.5 rounded border-input" />
          Active
        </label>
      </HubFieldRow>
      <HubActionAlert state={state} className="mt-3" />
      <Button type="submit" className="mt-3" size="sm" disabled={pending}>
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
    <li className="rounded-lg border border-border">
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm text-primary/90">{goal.title}</span>
            {!goal.active ? (
              <Badge variant="secondary" className="font-mono text-[8px] uppercase">
                Inactive
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
            {goal.points_required} pts · {formatRewardGoalDetail(goal, packageNames)}
          </p>
          {goal.description ? (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{goal.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DeleteGoalButton goalId={goal.id} />
          <Button
            type="button"
            variant="outline"
            size="sm"
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
        size="sm"
        className="border-destructive/40 text-destructive hover:bg-destructive/10"
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
        size="sm"
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
        <HubStatCard label="Reward goals" value={goals.length} />
        <HubStatCard label="Active goals" value={activeGoals} />
        <HubStatCard label="Unused redemptions" value={pendingRedemptions.length} />
      </div>

      <Card className="border-border/80 bg-card/40 px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
            Program settings
          </h2>
          <Link
            href="/rewards"
            className="font-mono text-[9px] text-primary/60 hover:text-primary"
          >
            Public /rewards →
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Points on billed jobs (not with promo codes). Checkout rewards link automatically.
        </p>
        <form action={settingsAction} className="mt-4 space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={settings.enabled}
                className="size-3.5 rounded border-input"
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Program enabled
              </span>
            </label>
            <HubFormField label="Points per $1" htmlFor="points_per_dollar" className="max-w-[8rem]">
              <HubInput
                id="points_per_dollar"
                name="points_per_dollar"
                type="number"
                step="0.01"
                min={0}
                defaultValue={settings.points_per_dollar}
              />
            </HubFormField>
          </div>
          <HubActionAlert state={settingsState} />
          <Button type="submit" size="sm" disabled={settingsPending}>
            {settingsPending ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </Card>

      {pendingRedemptions.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
              Unused redemptions
            </h2>
            <span className="font-mono text-[9px] text-muted-foreground">Redeemed, not on a booking</span>
          </div>
          <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-primary/20 bg-primary/[0.03]">
            {pendingRedemptions.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2 last:border-0"
              >
                <div className="min-w-0 text-sm">
                  <span className="text-primary/90">{r.goal_title ?? "Reward"}</span>
                  <span className="text-muted-foreground"> · {r.points_spent} pts</span>
                  <p className="truncate font-mono text-[9px] text-muted-foreground">
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

      <HubFormSection title="Reward goals" description="Tap Edit to change a goal">
        {!goals.length ? (
          <p className="rounded-lg border border-border px-4 py-6 text-sm text-muted-foreground">
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

        <HubDetailsSection summary="+ Add reward goal" className="mt-4">
          <form action={createAction}>
            <HubFieldRow className="gap-2.5">
              <HubFormField label="Title" htmlFor="new-goal-title" className="sm:col-span-2" required>
                <HubInput
                  id="new-goal-title"
                  name="title"
                  required
                  placeholder="e.g. Free Gold wash"
                />
              </HubFormField>
              <HubFormField label="Description" htmlFor="new-goal-desc" className="sm:col-span-2">
                <HubInput id="new-goal-desc" name="description" />
              </HubFormField>
              <HubFormField label="Points required" htmlFor="new-goal-pts" required>
                <HubInput
                  id="new-goal-pts"
                  name="points_required"
                  type="number"
                  min={1}
                  required
                  placeholder="500"
                />
              </HubFormField>
              <HubFormField label="Sort order" htmlFor="new-goal-sort">
                <HubInput id="new-goal-sort" name="sort_order" type="number" defaultValue={0} />
              </HubFormField>
              <RewardKindFields packages={catalog.packages} addons={catalog.addons} />
              <label className="flex items-end gap-1.5 pb-0.5 text-xs sm:col-span-2">
                <input type="checkbox" name="active" defaultChecked className="size-3.5 rounded border-input" />
                Active
              </label>
            </HubFieldRow>
            <Button type="submit" className="mt-4" size="sm" disabled={createPending}>
              {createPending ? "Adding…" : "Add goal"}
            </Button>
            <HubActionAlert state={createState} className="mt-3" />
          </form>
        </HubDetailsSection>
      </HubFormSection>
    </div>
  );
}
