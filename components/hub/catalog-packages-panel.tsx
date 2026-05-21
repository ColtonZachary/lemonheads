"use client";

import { useActionState } from "react";

import {
  createCatalogPackage,
  deleteCatalogPackage,
  updateCatalogPackage,
  type HubCatalogActionState,
} from "@/app/actions/hub-catalog";
import { Button } from "@/components/ui/button";
import type { CatalogPackageRow } from "@/lib/hub/catalog-db";
import { VEHICLE_OPTIONS } from "@/lib/data";
import { cn } from "@/lib/utils";

const EMPTY: HubCatalogActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

function dollars(cents: number): string {
  return cents > 0 ? String(cents / 100) : "";
}

function PackageEditForm({ pkg }: { pkg: CatalogPackageRow }) {
  const [state, action, pending] = useActionState(
    updateCatalogPackage.bind(null, pkg.key),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCatalogPackage.bind(null, pkg.key),
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
          <input name="name" required defaultValue={pkg.name} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Duration (hours) *</span>
          <input
            name="duration_hours"
            type="number"
            step="0.5"
            min="0.5"
            required
            defaultValue={String(pkg.duration_hours)}
            className={fieldClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Description</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={pkg.description}
            className={fieldClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Features (one per line)</span>
          <textarea
            name="features"
            rows={4}
            defaultValue={pkg.features.join("\n")}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Sort order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={String(pkg.sort_order)}
            className={fieldClass}
          />
        </label>
        <div className="flex flex-wrap items-end gap-4 pb-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={pkg.featured} className="size-4" />
            Featured on site
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" defaultChecked={pkg.active} className="size-4" />
            Active
          </label>
        </div>
      </div>

      <div>
        <p className={labelClass}>Prices by vehicle ($)</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VEHICLE_OPTIONS.map((v) => (
            <label key={v.key} className="block">
              <span className="font-mono text-[9px] text-text/45">{v.label}</span>
              <input
                name={`price_${v.key}`}
                inputMode="decimal"
                defaultValue={dollars(pkg.prices[v.key] ?? 0)}
                className={fieldClass}
                placeholder="0"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy} className="h-auto min-h-0 px-3 py-1.5 text-xs">
          {pending ? "Saving…" : "Save package"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          variant="outline"
          disabled={busy}
          className="h-auto min-h-0 border-red-500/30 px-3 py-1.5 text-xs text-red-200"
          onClick={(e) => {
            if (
              !confirm(
                `Permanently delete package “${pkg.name}”? Existing bookings may block this.`,
              )
            ) {
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

export function CatalogPackagesPanel({ packages }: { packages: CatalogPackageRow[] }) {
  const [createState, createAction, createPending] = useActionState(
    createCatalogPackage,
    EMPTY,
  );

  return (
    <div className="space-y-10">
      <form action={createAction} className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Add package
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Key * (no spaces)</span>
            <input name="key" required placeholder="fully" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Name *</span>
            <input name="name" required className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Duration (hours)</span>
            <input
              name="duration_hours"
              type="number"
              step="0.5"
              defaultValue="2"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Sort order</span>
            <input name="sort_order" type="number" defaultValue="99" className={fieldClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Description</span>
            <textarea name="description" rows={2} className={fieldClass} />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm sm:col-span-2">
            <input type="checkbox" name="featured" className="size-4" />
            Featured on site
          </label>
        </div>
        <p className="mt-4 font-mono text-[9px] text-text/35">
          Initial prices ($) — edit all vehicles after creating
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VEHICLE_OPTIONS.map((v) => (
            <label key={v.key} className="block">
              <span className="font-mono text-[9px] text-text/45">{v.label}</span>
              <input name={`price_${v.key}`} inputMode="decimal" className={fieldClass} />
            </label>
          ))}
        </div>
        <Button type="submit" className="mt-6" disabled={createPending}>
          {createPending ? "Adding…" : "Add package"}
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
          Packages ({packages.length})
        </h3>
        {!packages.length ? (
          <p className="mt-4 text-sm text-text/40">
            No packages in the database. Run <code className="text-y/70">npm run hub:seed</code> or
            add one above.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {packages.map((pkg) => (
              <li
                key={pkg.key}
                className={cn(
                  "rounded-md border px-4 py-4",
                  pkg.active ? "border-white/10" : "border-white/5 opacity-60",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-y/85">{pkg.name}</span>
                  <span className="font-mono text-[9px] text-text/40">{pkg.key}</span>
                  {pkg.featured && (
                    <span className="rounded bg-y/10 px-2 py-0.5 font-mono text-[9px] text-y/70">
                      Featured
                    </span>
                  )}
                  {!pkg.active && (
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[9px] text-text/50">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-text/50">
                  {pkg.duration_hours}h · from $
                  {(() => {
                    const positive = VEHICLE_OPTIONS.map((v) => pkg.prices[v.key] ?? 0).filter(
                      (c) => c > 0,
                    );
                    return positive.length ? Math.min(...positive) / 100 : "—";
                  })()}
                </p>
                <PackageEditForm pkg={pkg} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
