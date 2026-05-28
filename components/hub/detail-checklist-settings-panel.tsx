"use client";

import { useActionState } from "react";

import {
  createChecklistItem,
  deleteChecklistItem,
  updateChecklistItem,
  type HubChecklistActionState,
} from "@/app/actions/hub-checklist";
import { Button } from "@/components/ui/button";
import type { DetailChecklistItemRow } from "@/lib/hub/detail-checklist-db";
import { cn } from "@/lib/utils";

const EMPTY: HubChecklistActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

function ItemRow({ item }: { item: DetailChecklistItemRow }) {
  const [state, action, pending] = useActionState(updateChecklistItem, EMPTY);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteChecklistItem,
    EMPTY,
  );

  return (
    <li className="rounded-lg border border-white/10 p-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="item_id" value={item.id} />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Label</span>
            <input name="label" defaultValue={item.label} required className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Sort order</span>
            <input
              name="sort_order"
              type="number"
              defaultValue={item.sort_order}
              className={fieldClass}
            />
          </label>
          <label className="flex items-end gap-2 pb-1 text-xs">
            <input type="checkbox" name="active" defaultChecked={item.active} />
            Active
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="h-auto min-h-0 px-3 py-1.5 text-xs" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
        {state.message ? (
          <p className={cn("text-xs", state.ok ? "text-y/80" : "text-red-300")}>{state.message}</p>
        ) : null}
      </form>
      <form action={deleteAction} className="mt-2">
        <input type="hidden" name="item_id" value={item.id} />
        <Button
          type="submit"
          variant="outline"
          className="h-auto min-h-0 border-red-500/30 px-2 py-1 text-[10px] text-red-200"
          disabled={deletePending}
        >
          {deletePending ? "…" : "Delete"}
        </Button>
        {deleteState.message && !deleteState.ok ? (
          <span className="ml-2 text-xs text-red-300">{deleteState.message}</span>
        ) : null}
      </form>
    </li>
  );
}

export function DetailChecklistSettingsPanel({ items }: { items: DetailChecklistItemRow[] }) {
  const [createState, createAction, createPending] = useActionState(createChecklistItem, EMPTY);

  return (
    <div className="space-y-6">
      <p className="text-sm text-text/45">
        Detailers must confirm these items in the mobile app after each job. Changes apply to
        future completions.
      </p>

      <ul className="space-y-3">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>

      <details className="rounded-lg border border-white/10 bg-card/30">
        <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-y [&::-webkit-details-marker]:hidden">
          + Add checklist item
        </summary>
        <form action={createAction} className="border-t border-white/10 px-4 py-4">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Label *</span>
              <input name="label" required className={fieldClass} placeholder="e.g. Tires dressed" />
            </label>
            <label className="block">
              <span className={labelClass}>Sort order</span>
              <input name="sort_order" type="number" defaultValue={0} className={fieldClass} />
            </label>
          </div>
          <Button
            type="submit"
            className="mt-4 h-auto min-h-0 px-4 py-2 text-xs"
            disabled={createPending}
          >
            {createPending ? "Adding…" : "Add item"}
          </Button>
          {createState.message ? (
            <p
              className={cn(
                "mt-3 rounded border px-3 py-2 font-mono text-[10px]",
                createState.ok
                  ? "border-y/30 bg-y/10 text-y"
                  : "border-red-500/30 bg-red-500/10 text-red-200",
              )}
            >
              {createState.message}
            </p>
          ) : null}
        </form>
      </details>
    </div>
  );
}
