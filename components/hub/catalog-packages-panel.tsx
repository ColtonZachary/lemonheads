"use client";

import { useActionState, useState } from "react";

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
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

function dollars(cents: number): string {
  return cents > 0 ? String(cents / 100) : "";
}

function minPriceDollars(pkg: CatalogPackageRow): string {
  const positive = VEHICLE_OPTIONS.map((v) => pkg.prices[v.key] ?? 0).filter(
    (c) => c > 0,
  );
  return positive.length ? String(Math.min(...positive) / 100) : "—";
}

function VehiclePriceFields({ pkg }: { pkg?: CatalogPackageRow }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {VEHICLE_OPTIONS.map((v) => (
        <label key={v.key} className="block">
          <span className="font-mono text-[8px] text-text/45">{v.label}</span>
          <input
            name={`price_${v.key}`}
            inputMode="decimal"
            defaultValue={pkg ? dollars(pkg.prices[v.key] ?? 0) : undefined}
            className={fieldClass}
            placeholder="0"
          />
        </label>
      ))}
    </div>
  );
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
    <form
      action={action}
      className="border-t border-white/10 bg-white/[0.02] px-3 py-3 sm:px-4"
    >
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Name *</span>
          <input name="name" required defaultValue={pkg.name} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Duration (h) *</span>
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
        <label className="block">
          <span className={labelClass}>Sort</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={String(pkg.sort_order)}
            className={fieldClass}
          />
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={labelClass}>Description</span>
          <textarea
            name="description"
            rows={1}
            defaultValue={pkg.description}
            className={cn(fieldClass, "min-h-[2.25rem] resize-y")}
          />
        </label>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="featured" defaultChecked={pkg.featured} className="size-3.5" />
          Featured
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="active" defaultChecked={pkg.active} className="size-3.5" />
          Active
        </label>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.1em] text-text/45 hover:text-y [&::-webkit-details-marker]:hidden">
          Features (one per line)
        </summary>
        <textarea
          name="features"
          rows={3}
          defaultValue={pkg.features.join("\n")}
          className={cn(fieldClass, "mt-2")}
        />
      </details>

      <details className="mt-2">
        <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.1em] text-text/45 hover:text-y [&::-webkit-details-marker]:hidden">
          Prices by vehicle ($)
        </summary>
        <VehiclePriceFields pkg={pkg} />
      </details>

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
            if (
              !confirm(
                `Permanently delete package "${pkg.name}"? Existing bookings may block this.`,
              )
            ) {
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

function PackageListRow({
  pkg,
  expanded,
  onToggleEdit,
}: {
  pkg: CatalogPackageRow;
  expanded: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <li
      className={cn(
        "overflow-hidden rounded-lg border",
        pkg.active ? "border-white/10" : "border-white/5 opacity-75",
        expanded && "border-y/25",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono text-sm text-y/90">{pkg.name}</span>
            <span className="font-mono text-[9px] text-text/40">{pkg.key}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-text/45">
              {pkg.duration_hours}h · from ${minPriceDollars(pkg)}
            </span>
            {pkg.featured ? (
              <span className="rounded bg-y/10 px-1.5 py-0.5 font-mono text-[8px] text-y/70">
                Featured
              </span>
            ) : null}
            {!pkg.active ? (
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[8px] text-text/50">
                Inactive
              </span>
            ) : null}
          </div>
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
      {expanded ? <PackageEditForm pkg={pkg} /> : null}
    </li>
  );
}

export function CatalogPackagesPanel({ packages }: { packages: CatalogPackageRow[] }) {
  const [createState, createAction, createPending] = useActionState(
    createCatalogPackage,
    EMPTY,
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const active = packages.filter((p) => p.active);
  const inactive = packages.filter((p) => !p.active);

  const toggleEdit = (key: string) => {
    setExpandedKey((cur) => (cur === key ? null : key));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Active</p>
          <p className="font-display text-2xl text-y">{active.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Featured</p>
          <p className="font-display text-2xl text-y">
            {packages.filter((p) => p.featured && p.active).length}
          </p>
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
          + Add package
        </summary>
        <form action={createAction} className="border-t border-white/10 px-4 py-4">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className={labelClass}>Key *</span>
              <input name="key" required placeholder="fully" className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Name *</span>
              <input name="name" required className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Duration (h)</span>
              <input
                name="duration_hours"
                type="number"
                step="0.5"
                defaultValue="2"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Sort</span>
              <input name="sort_order" type="number" defaultValue="99" className={fieldClass} />
            </label>
            <label className="flex items-end gap-1.5 pb-0.5 text-xs sm:col-span-2">
              <input type="checkbox" name="featured" className="size-3.5" />
              Featured
            </label>
            <label className="block sm:col-span-2 lg:col-span-4">
              <span className={labelClass}>Description</span>
              <input name="description" className={fieldClass} placeholder="Optional" />
            </label>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-text/45">
              Initial prices ($)
            </summary>
            <VehiclePriceFields />
          </details>
          <Button type="submit" className="mt-4 h-auto min-h-0 px-4 py-2 text-xs" disabled={createPending}>
            {createPending ? "Adding…" : "Add package"}
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
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Packages
          </h2>
          <span className="font-mono text-[9px] text-text/35">Tap Edit to change pricing & copy</span>
        </div>
        {!active.length ? (
          <p className="rounded-lg border border-white/10 px-4 py-6 text-sm text-text/40">
            No active packages. Expand &ldquo;Add package&rdquo; or run{" "}
            <code className="text-y/70">npm run hub:seed</code>.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((pkg) => (
              <PackageListRow
                key={pkg.key}
                pkg={pkg}
                expanded={expandedKey === pkg.key}
                onToggleEdit={() => toggleEdit(pkg.key)}
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
            {inactive.map((pkg) => (
              <PackageListRow
                key={pkg.key}
                pkg={pkg}
                expanded={expandedKey === pkg.key}
                onToggleEdit={() => toggleEdit(pkg.key)}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
