"use client";

import { useActionState } from "react";

import {
  createChecklistItem,
  deleteChecklistItem,
  updateChecklistItem,
  type HubChecklistActionState,
} from "@/app/actions/hub-checklist";
import {
  HubActionAlert,
  HubDetailsSection,
  HubEmptyState,
} from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubInput,
} from "@/components/hub/hub-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DetailChecklistItemRow } from "@/lib/hub/detail-checklist-db";

const EMPTY: HubChecklistActionState = { ok: false, message: "" };

function ItemRow({ item }: { item: DetailChecklistItemRow }) {
  const [state, action, pending] = useActionState(updateChecklistItem, EMPTY);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteChecklistItem,
    EMPTY,
  );

  return (
    <Card className="border-border/80">
      <CardContent className="space-y-3 pt-4">
        <form action={action} className="space-y-3">
          <input type="hidden" name="item_id" value={item.id} />
          <HubFieldRow>
            <HubFormField label="Label" htmlFor={`label-${item.id}`} required className="sm:col-span-2">
              <HubInput
                id={`label-${item.id}`}
                name="label"
                defaultValue={item.label}
                required
              />
            </HubFormField>
            <HubFormField label="Sort order" htmlFor={`sort-${item.id}`}>
              <HubInput
                id={`sort-${item.id}`}
                name="sort_order"
                type="number"
                defaultValue={String(item.sort_order)}
              />
            </HubFormField>
            <label className="flex items-center gap-2 pb-1 text-sm sm:items-end">
              <input
                type="checkbox"
                name="active"
                defaultChecked={item.active}
                className="size-4 accent-primary"
              />
              Active
            </label>
          </HubFieldRow>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <HubActionAlert state={state} />
        </form>
        <form action={deleteAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="item_id" value={item.id} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deletePending}
          >
            {deletePending ? "Deleting…" : "Delete"}
          </Button>
          <HubActionAlert state={deleteState} />
        </form>
      </CardContent>
    </Card>
  );
}

export function DetailChecklistSettingsPanel({ items }: { items: DetailChecklistItemRow[] }) {
  const [createState, createAction, createPending] = useActionState(createChecklistItem, EMPTY);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Detailers must confirm these items in the mobile app after each job. Changes apply to
        future completions.
      </p>

      {items.length === 0 ? (
        <HubEmptyState>No checklist items yet. Add one below.</HubEmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <ItemRow item={item} />
            </li>
          ))}
        </ul>
      )}

      <HubDetailsSection summary="+ Add checklist item">
        <form action={createAction} className="space-y-4">
          <HubFieldRow>
            <HubFormField
              label="Label"
              htmlFor="new-checklist-label"
              required
              className="sm:col-span-2"
            >
              <HubInput
                id="new-checklist-label"
                name="label"
                required
                placeholder="e.g. Tires dressed"
              />
            </HubFormField>
            <HubFormField label="Sort order" htmlFor="new-checklist-sort">
              <HubInput
                id="new-checklist-sort"
                name="sort_order"
                type="number"
                defaultValue="0"
              />
            </HubFormField>
          </HubFieldRow>
          <Button type="submit" disabled={createPending}>
            {createPending ? "Adding…" : "Add item"}
          </Button>
          <HubActionAlert state={createState} />
        </form>
      </HubDetailsSection>
    </div>
  );
}
