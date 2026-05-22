"use client";

import { useActionState, useState } from "react";

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
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
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
    <form
      action={action}
      className="border-t border-white/10 bg-white/[0.02] px-3 py-3 sm:px-4"
    >
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
          <span className={labelClass}>Suffix</span>
          <input
            name="price_suffix"
            defaultValue={addon.price_suffix}
            placeholder="per seat"
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
        <label className="block">
          <span className={labelClass}>Sort</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={String(addon.sort_order)}
            className={fieldClass}
          />
        </label>
        <label className="flex items-end gap-1.5 pb-0.5 text-xs">
          <input type="checkbox" name="active" defaultChecked={addon.active} className="size-3.5" />
          Active
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={labelClass}>Description</span>
          <textarea
            name="description"
            rows={1}
            defaultValue={addon.description}
            className={cn(fieldClass, "min-h-[2.25rem] resize-y")}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" disabled={busy} className="h-auto min-h-0 px-3 py-1.5 text-xs">
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          variant="outline"
          disabled={busy}
          className="h-auto min-h-0 border-red-500/30 px-3 py-1.5 text-xs text-red-200"
          onClick={(e) => {
            if (!confirm(`Delete add-on "${addon.name}"?`)) {
              e.preventDefault();
            }
          }}
        >
          {deletePending ? "…" : "Delete"}
        </Button>
      </div>

      {feedback ? (
        <p className={cn("mt-2 font-mono text-[10px]", feedbackOk ? "text-y" : "text-red-200")}>
          {feedback}
        </p>
      ) : null}
    </form>
  );
}

function AddonListRow({
  addon,
  expanded,
  onToggleEdit,
}: {
  addon: CatalogAddonRow;
  expanded: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <li
      className={cn(
        "overflow-hidden rounded-lg border",
        addon.active ? "border-white/10" : "border-white/5 opacity-75",
        expanded && "border-y/25",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-sm text-y/90">{addon.name}</span>
            <span className="text-xs text-text/45">
              ${addon.price_cents / 100}
              {addon.price_suffix ? ` ${addon.price_suffix}` : ""} · {addon.icon}
            </span>
          </div>
          {!addon.active ? (
            <span className="mt-0.5 inline-block rounded bg-white/10 px-1.5 py-0.5 font-mono text-[8px] text-text/50">
              Inactive
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-0 shrink-0 px-2 py-1 text-[10px]"
          onClick={onToggleEdit}
        >
          {expanded ? "Close" : "Edit"}
        </Button>
      </div>
      {expanded ? <AddonEditForm addon={addon} /> : null}
    </li>
  );
}

export function CatalogAddonsPanel({ addons }: { addons: CatalogAddonRow[] }) {
  const [createState, createAction, createPending] = useActionState(
    createCatalogAddon,
    EMPTY,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = addons.filter((a) => a.active);
  const inactive = addons.filter((a) => !a.active);

  const toggleEdit = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Active</p>
          <p className="font-display text-2xl text-y">{active.length}</p>
        </div>
        {inactive.length > 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Inactive</p>
            <p className="font-display text-2xl text-text/50">{inactive.length}</p>
          </div>
        ) : null}
      </div>

      <details className="rounded-lg border border-white/10 bg-card/30">
        <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-y [&::-webkit-details-marker]:hidden">
          + Add add-on
        </summary>
        <form action={createAction} className="border-t border-white/10 px-4 py-4">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className={labelClass}>Name *</span>
              <input name="name" required className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Price ($) *</span>
              <input name="price" inputMode="decimal" required className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Suffix</span>
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
            <label className="block">
              <span className={labelClass}>Sort</span>
              <input name="sort_order" type="number" defaultValue="99" className={fieldClass} />
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className={labelClass}>Description</span>
              <input name="description" className={fieldClass} placeholder="Optional" />
            </label>
          </div>
          <Button type="submit" className="mt-4 h-auto min-h-0 px-4 py-2 text-xs" disabled={createPending}>
            {createPending ? "Adding…" : "Add add-on"}
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

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Add-ons</h2>
          <span className="font-mono text-[9px] text-text/35">Tap Edit to update</span>
        </div>
        {!active.length ? (
          <p className="rounded-lg border border-white/10 px-4 py-6 text-sm text-text/40">
            No active add-ons. Expand &ldquo;Add add-on&rdquo; or run{" "}
            <code className="text-y/70">npm run hub:seed</code>.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((addon) => (
              <AddonListRow
                key={addon.id}
                addon={addon}
                expanded={expandedId === addon.id}
                onToggleEdit={() => toggleEdit(addon.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {inactive.length > 0 ? (
        <details className="rounded-lg border border-white/5">
          <summary className="cursor-pointer list-none px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text/45 [&::-webkit-details-marker]:hidden">
            Inactive ({inactive.length})
          </summary>
          <ul className="space-y-2 border-t border-white/5 px-3 py-3">
            {inactive.map((addon) => (
              <AddonListRow
                key={addon.id}
                addon={addon}
                expanded={expandedId === addon.id}
                onToggleEdit={() => toggleEdit(addon.id)}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
