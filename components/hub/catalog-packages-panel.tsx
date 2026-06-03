"use client";

import { useActionState, useState } from "react";

import {
  createCatalogPackage,
  deleteCatalogPackage,
  updateCatalogPackage,
  type HubCatalogActionState,
} from "@/app/actions/hub-catalog";
import {
  HubActionAlert,
  HubDetailsSection,
  HubEmptyState,
  HubStatCard,
} from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubFormSection,
  HubInput,
  HubTextarea,
} from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CatalogAddonRow, CatalogPackageRow } from "@/lib/hub/catalog-db";
import type { PackageAddonBlocksMap } from "@/lib/bookings/package-addon-blocks";
import { getBlockedAddonNamesForPackage } from "@/lib/bookings/package-addon-blocks";
import { PackageAddonBlocksField } from "@/components/hub/package-addon-blocks-field";
import { VEHICLE_OPTIONS } from "@/lib/data";
import { cn } from "@/lib/utils";

const EMPTY: HubCatalogActionState = { ok: false, message: "" };

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
        <HubFormField key={v.key} label={v.label} htmlFor={`price-${v.key}-${pkg?.key ?? "new"}`}>
          <HubInput
            id={`price-${v.key}-${pkg?.key ?? "new"}`}
            name={`price_${v.key}`}
            inputMode="decimal"
            defaultValue={pkg ? dollars(pkg.prices[v.key] ?? 0) : undefined}
            placeholder="0"
          />
        </HubFormField>
      ))}
    </div>
  );
}

function PackageFormFields({ pkg }: { pkg?: CatalogPackageRow }) {
  const id = pkg?.key ?? "create";
  return (
    <>
      <HubFieldRow>
        {!pkg ? (
          <HubFormField label="Key" htmlFor={`key-${id}`} required>
            <HubInput id={`key-${id}`} name="key" required placeholder="fully" />
          </HubFormField>
        ) : null}
        <HubFormField label="Name" htmlFor={`name-${id}`} required>
          <HubInput
            id={`name-${id}`}
            name="name"
            required
            defaultValue={pkg?.name}
          />
        </HubFormField>
        <HubFormField label="Duration (h)" htmlFor={`duration-${id}`} required>
          <HubInput
            id={`duration-${id}`}
            name="duration_hours"
            type="number"
            step="0.5"
            min="0.5"
            required
            defaultValue={pkg ? String(pkg.duration_hours) : "2"}
          />
        </HubFormField>
        <HubFormField label="Sort" htmlFor={`sort-${id}`}>
          <HubInput
            id={`sort-${id}`}
            name="sort_order"
            type="number"
            defaultValue={pkg ? String(pkg.sort_order) : "99"}
          />
        </HubFormField>
        <HubFormField
          label="Description"
          htmlFor={`desc-${id}`}
          className="sm:col-span-2 lg:col-span-3"
        >
          {pkg ? (
            <HubTextarea
              id={`desc-${id}`}
              name="description"
              rows={1}
              defaultValue={pkg.description}
              className="min-h-[2.25rem] resize-y"
            />
          ) : (
            <HubInput
              id={`desc-${id}`}
              name="description"
              placeholder="Optional"
            />
          )}
        </HubFormField>
      </HubFieldRow>

      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={pkg?.featured}
            className="size-3.5 rounded border-input"
          />
          Featured
        </label>
        {pkg ? (
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              name="active"
              defaultChecked={pkg.active}
              className="size-3.5 rounded border-input"
            />
            Active
          </label>
        ) : null}
      </div>

      {pkg ? (
        <>
          <details className="mt-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
            <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground [&::-webkit-details-marker]:hidden">
              Features (one per line)
            </summary>
            <HubTextarea
              name="features"
              rows={3}
              defaultValue={pkg.features.join("\n")}
              className="mt-2"
            />
          </details>
          <details className="mt-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
            <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground [&::-webkit-details-marker]:hidden">
              Prices by vehicle ($)
            </summary>
            <VehiclePriceFields pkg={pkg} />
          </details>
        </>
      ) : (
        <details className="mt-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
          <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            Initial prices ($)
          </summary>
          <VehiclePriceFields />
        </details>
      )}
    </>
  );
}

function PackageEditForm({
  pkg,
  addons,
  packageAddonBlocks,
}: {
  pkg: CatalogPackageRow;
  addons: CatalogAddonRow[];
  packageAddonBlocks: PackageAddonBlocksMap;
}) {
  const [state, action, pending] = useActionState(
    updateCatalogPackage.bind(null, pkg.key),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCatalogPackage.bind(null, pkg.key),
    EMPTY,
  );
  const busy = pending || deletePending;

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-3 py-3 sm:px-4">
      <PackageFormFields pkg={pkg} />
      <PackageAddonBlocksField
        packageKey={pkg.key}
        addons={addons}
        blockedNames={getBlockedAddonNamesForPackage(packageAddonBlocks, pkg.key)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          variant="outline"
          size="sm"
          disabled={busy}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
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

      <HubActionAlert
        state={{
          ok: deleteState.message ? deleteState.ok : state.ok,
          message: deleteState.message || state.message,
        }}
        className="mt-2"
      />
    </form>
  );
}

function PackageListRow({
  pkg,
  addons,
  packageAddonBlocks,
  expanded,
  onToggleEdit,
}: {
  pkg: CatalogPackageRow;
  addons: CatalogAddonRow[];
  packageAddonBlocks: PackageAddonBlocksMap;
  expanded: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80",
        !pkg.active && "opacity-75",
        expanded && "border-primary/30",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono text-sm text-primary">{pkg.name}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{pkg.key}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {pkg.duration_hours}h · from ${minPriceDollars(pkg)}
            </span>
            {pkg.featured ? (
              <Badge variant="secondary" className="font-mono text-[8px]">
                Featured
              </Badge>
            ) : null}
            {!pkg.active ? (
              <Badge variant="outline" className="font-mono text-[8px]">
                Inactive
              </Badge>
            ) : null}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToggleEdit}>
          {expanded ? "Close" : "Edit"}
        </Button>
      </div>
      {expanded ? (
        <PackageEditForm
          pkg={pkg}
          addons={addons}
          packageAddonBlocks={packageAddonBlocks}
        />
      ) : null}
    </Card>
  );
}

export function CatalogPackagesPanel({
  packages,
  addons,
  packageAddonBlocks,
}: {
  packages: CatalogPackageRow[];
  addons: CatalogAddonRow[];
  packageAddonBlocks: PackageAddonBlocksMap;
}) {
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
        <HubStatCard label="Active" value={active.length} />
        <HubStatCard
          label="Featured"
          value={packages.filter((p) => p.featured && p.active).length}
        />
        {inactive.length > 0 ? (
          <HubStatCard label="Inactive" value={inactive.length} />
        ) : null}
      </div>

      <HubDetailsSection summary="+ Add package">
        <form action={createAction}>
          <PackageFormFields />
          <Button type="submit" className="mt-4" disabled={createPending}>
            {createPending ? "Adding…" : "Add package"}
          </Button>
          <HubActionAlert state={createState} className="mt-3" />
        </form>
      </HubDetailsSection>

      <HubFormSection
        title="Packages"
        description="Tap Edit to change pricing and copy"
      >
        {!active.length ? (
          <HubEmptyState>
            No active packages. Expand &ldquo;Add package&rdquo; or run{" "}
            <code className="text-primary">npm run hub:seed</code>.
          </HubEmptyState>
        ) : (
          <ul className="space-y-2">
            {active.map((pkg) => (
              <li key={pkg.key}>
                <PackageListRow
                  pkg={pkg}
                  addons={addons}
                  packageAddonBlocks={packageAddonBlocks}
                  expanded={expandedKey === pkg.key}
                  onToggleEdit={() => toggleEdit(pkg.key)}
                />
              </li>
            ))}
          </ul>
        )}
      </HubFormSection>

      {inactive.length > 0 ? (
        <HubDetailsSection summary={`Inactive (${inactive.length})`}>
          <ul className="space-y-2">
            {inactive.map((pkg) => (
              <li key={pkg.key}>
                <PackageListRow
                  pkg={pkg}
                  addons={addons}
                  packageAddonBlocks={packageAddonBlocks}
                  expanded={expandedKey === pkg.key}
                  onToggleEdit={() => toggleEdit(pkg.key)}
                />
              </li>
            ))}
          </ul>
        </HubDetailsSection>
      ) : null}
    </div>
  );
}
