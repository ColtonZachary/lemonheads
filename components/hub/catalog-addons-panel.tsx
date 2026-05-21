"use client";

import { useActionState } from "react";

import {
  createCatalogAddon,
  deleteCatalogAddon,
  updateCatalogAddon,
  type HubCatalogActionState,
} from "@/app/actions/hub-catalog";
import { Button } from "@/components/ui/button";
import { ADDON_ICON_OPTIONS } from "@/lib/hub/catalog-icons";
import type { CatalogAddonRow } from "@/lib/hub/catalog-db";
import { cn } from "@/lib/utils";

const EMPTY: HubCatalogActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

function dollars(cents: number): string {
  return cents > 0 ? String(cents / 100) : "0";
}

function AddonEditForm({ addon }: { addon: CatalogAddonRow }) {
  const [state, action, pending] = useActionState(
    updateCatalogAddon.bind(null, addon.id),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCatalogAddon.bind(null, addon.id),
    EMPTY,
  );
  const busy = pending || deletePending;
  const feedback = deleteState.message || state.message;
  const feedbackOk = deleteState.message ? deleteState.ok : state.ok;

  return (
    <form action={action} className="mt-4 space-y-4 border-t border-white/10 pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Name *</span>
          <input name="name" required defaultValue={addon.name} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Price ($) *</span>
          <input
            name="price"
            inputMode="decimal"
            required
            defaultValue={dollars(addon.price_cents)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Price suffix</span>
          <input
            name="price_suffix"
            defaultValue={addon.price_suffix}
            placeholder="e.g. per seat"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Icon</span>
          <select name="icon" defaultValue={addon.icon} className={fieldClass}>
            {ADDON_ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Description</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={addon.description}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Sort order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={String(addon.sort_order)}
            className={fieldClass}
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={addon.active} className="size-4" />
          Active
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy} className="h-auto min-h-0 px-3 py-1.5 text-xs">
          {pending ? "Saving…" : "Save add-on"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          variant="outline"
          disabled={busy}
          className="h-auto min-h-0 border-red-500/30 px-3 py-1.5 text-xs text-red-200"
          onClick={(e) => {
            if (!confirm(`Delete add-on “${addon.name}”?`)) {
              e.preventDefault();
            }
          }}
        >
          {deletePending ? "Deleting…" : "Delete"}
        </Button>
      </div>

      {feedback && (
        <p className={cn("font-mono text-xs", feedbackOk ? "text-y" : "text-red-200")}>
          {feedback}
        </p>
      )}
    </form>
  );
}

export function CatalogAddonsPanel({ addons }: { addons: CatalogAddonRow[] }) {
  const [createState, createAction, createPending] = useActionState(
    createCatalogAddon,
    EMPTY,
  );

  return (
    <div className="space-y-10">
      <form action={createAction} className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Add add-on
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Name *</span>
            <input name="name" required className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Price ($) *</span>
            <input name="price" inputMode="decimal" required className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Price suffix</span>
            <input name="price_suffix" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Icon</span>
            <select name="icon" defaultValue="spray" className={fieldClass}>
              {ADDON_ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Description</span>
            <textarea name="description" rows={2} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Sort order</span>
            <input name="sort_order" type="number" defaultValue="99" className={fieldClass} />
          </label>
        </div>
        <Button type="submit" className="mt-6" disabled={createPending}>
          {createPending ? "Adding…" : "Add add-on"}
        </Button>
        {createState.message && (
          <p
            className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
              createState.ok
                ? "border-y/30 bg-y/10 text-y"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {createState.message}
          </p>
        )}
      </form>

      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Add-ons ({addons.length})
        </h3>
        {!addons.length ? (
          <p className="mt-4 text-sm text-text/40">
            No add-ons yet. Run <code className="text-y/70">npm run hub:seed</code> or add one
            above.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {addons.map((addon) => (
              <li
                key={addon.id}
                className={cn(
                  "rounded-md border px-4 py-4",
                  addon.active ? "border-white/10" : "border-white/5 opacity-60",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-y/85">{addon.name}</span>
                  <span className="font-mono text-[9px] text-text/40">
                    ${addon.price_cents / 100}
                    {addon.price_suffix ? ` ${addon.price_suffix}` : ""} · {addon.icon}
                  </span>
                  {!addon.active && (
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[9px] text-text/50">
                      Inactive
                    </span>
                  )}
                </div>
                <AddonEditForm addon={addon} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
