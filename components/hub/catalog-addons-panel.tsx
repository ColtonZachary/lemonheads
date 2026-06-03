"use client";

import { useActionState, useState } from "react";

import {
  createCatalogAddon,
  deleteCatalogAddon,
  updateCatalogAddon,
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
  HubNativeSelect,
  HubTextarea,
} from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ADDON_ICON_OPTIONS } from "@/lib/hub/catalog-icons";
import type { CatalogAddonRow } from "@/lib/hub/catalog-db";
import { cn } from "@/lib/utils";

const EMPTY: HubCatalogActionState = { ok: false, message: "" };

function dollars(cents: number): string {
  return cents > 0 ? String(cents / 100) : "0";
}

function AddonFormFields({ addon, idPrefix }: { addon?: CatalogAddonRow; idPrefix: string }) {
  return (
    <HubFieldRow>
      <HubFormField label="Name" htmlFor={`${idPrefix}name`} required>
        <HubInput
          id={`${idPrefix}name`}
          name="name"
          required
          defaultValue={addon?.name}
        />
      </HubFormField>
      <HubFormField label="Price ($)" htmlFor={`${idPrefix}price`} required>
        <HubInput
          id={`${idPrefix}price`}
          name="price"
          inputMode="decimal"
          required
          defaultValue={addon ? dollars(addon.price_cents) : undefined}
        />
      </HubFormField>
      <HubFormField label="Suffix" htmlFor={`${idPrefix}price_suffix`}>
        <HubInput
          id={`${idPrefix}price_suffix`}
          name="price_suffix"
          defaultValue={addon?.price_suffix ?? ""}
          placeholder="per seat"
        />
      </HubFormField>
      <HubFormField label="Icon" htmlFor={`${idPrefix}icon`}>
        <HubNativeSelect
          id={`${idPrefix}icon`}
          name="icon"
          defaultValue={addon?.icon ?? "spray"}
        >
          {ADDON_ICON_OPTIONS.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </HubNativeSelect>
      </HubFormField>
      <HubFormField label="Category" htmlFor={`${idPrefix}category`}>
        <HubNativeSelect
          id={`${idPrefix}category`}
          name="category"
          defaultValue={addon?.category ?? "general"}
        >
          <option value="interior">Interior</option>
          <option value="exterior">Exterior</option>
          <option value="general">General</option>
        </HubNativeSelect>
      </HubFormField>
      <HubFormField label="Sort" htmlFor={`${idPrefix}sort_order`}>
        <HubInput
          id={`${idPrefix}sort_order`}
          name="sort_order"
          type="number"
          defaultValue={addon ? String(addon.sort_order) : "99"}
        />
      </HubFormField>
      {addon ? (
        <label className="flex items-end gap-1.5 pb-1 text-xs">
          <input
            type="checkbox"
            name="active"
            defaultChecked={addon.active}
            className="size-3.5 rounded border-input"
          />
          Active
        </label>
      ) : null}
      <HubFormField
        label="Description"
        htmlFor={`${idPrefix}description`}
        className="sm:col-span-2 lg:col-span-3"
      >
        {addon ? (
          <HubTextarea
            id={`${idPrefix}description`}
            name="description"
            rows={1}
            defaultValue={addon.description}
            className="min-h-[2.25rem] resize-y"
          />
        ) : (
          <HubInput
            id={`${idPrefix}description`}
            name="description"
            placeholder="Optional"
          />
        )}
      </HubFormField>
    </HubFieldRow>
  );
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

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-3 py-3 sm:px-4">
      <AddonFormFields addon={addon} idPrefix={`edit-${addon.id}-`} />
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
            if (!confirm(`Delete add-on "${addon.name}"?`)) {
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
    <Card
      className={cn(
        "overflow-hidden border-border/80",
        !addon.active && "opacity-75",
        expanded && "border-primary/30",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-sm text-primary">{addon.name}</span>
            <span className="text-xs text-muted-foreground">
              ${addon.price_cents / 100}
              {addon.price_suffix ? ` ${addon.price_suffix}` : ""} · {addon.icon}
            </span>
          </div>
          {!addon.active ? (
            <Badge variant="outline" className="mt-0.5 font-mono text-[8px]">
              Inactive
            </Badge>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToggleEdit}>
          {expanded ? "Close" : "Edit"}
        </Button>
      </div>
      {expanded ? <AddonEditForm addon={addon} /> : null}
    </Card>
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
        <HubStatCard label="Active" value={active.length} />
        {inactive.length > 0 ? (
          <HubStatCard label="Inactive" value={inactive.length} />
        ) : null}
      </div>

      <HubDetailsSection summary="+ Add add-on">
        <form action={createAction}>
          <AddonFormFields idPrefix="create-" />
          <Button type="submit" className="mt-4" disabled={createPending}>
            {createPending ? "Adding…" : "Add add-on"}
          </Button>
          <HubActionAlert state={createState} className="mt-3" />
        </form>
      </HubDetailsSection>

      <HubFormSection title="Add-ons" description="Tap Edit to update">
        {!active.length ? (
          <HubEmptyState>
            No active add-ons. Expand &ldquo;Add add-on&rdquo; or run{" "}
            <code className="text-primary">npm run hub:seed</code>.
          </HubEmptyState>
        ) : (
          <ul className="space-y-2">
            {active.map((addon) => (
              <li key={addon.id}>
                <AddonListRow
                  addon={addon}
                  expanded={expandedId === addon.id}
                  onToggleEdit={() => toggleEdit(addon.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </HubFormSection>

      {inactive.length > 0 ? (
        <HubDetailsSection summary={`Inactive (${inactive.length})`}>
          <ul className="space-y-2">
            {inactive.map((addon) => (
              <li key={addon.id}>
                <AddonListRow
                  addon={addon}
                  expanded={expandedId === addon.id}
                  onToggleEdit={() => toggleEdit(addon.id)}
                />
              </li>
            ))}
          </ul>
        </HubDetailsSection>
      ) : null}
    </div>
  );
}
