"use client";

import { useActionState, useState } from "react";

import {
  createBookingLocationType,
  deleteBookingLocationType,
  updateBookingLocationType,
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
} from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookingLocationTypeRow } from "@/lib/hub/catalog-db";
import { cn } from "@/lib/utils";

const EMPTY: HubCatalogActionState = { ok: false, message: "" };

function LocationFormFields({
  loc,
  idPrefix,
  layout = "grid",
}: {
  loc?: BookingLocationTypeRow;
  idPrefix: string;
  layout?: "grid" | "row";
}) {
  const labelField = (
    <HubFormField
      label="Label"
      htmlFor={`${idPrefix}label`}
      required
      className={layout === "row" ? "min-w-[12rem] flex-1" : undefined}
    >
      <HubInput
        id={`${idPrefix}label`}
        name="label"
        required
        defaultValue={loc?.label}
        placeholder={loc ? undefined : "Home driveway"}
      />
    </HubFormField>
  );
  const orderField = (
    <HubFormField
      label="Order"
      htmlFor={`${idPrefix}sort_order`}
      className={layout === "row" ? "w-24" : undefined}
    >
      <HubInput
        id={`${idPrefix}sort_order`}
        name="sort_order"
        type="number"
        defaultValue={loc ? String(loc.sort_order) : "99"}
      />
    </HubFormField>
  );

  if (layout === "row") {
    return (
      <div className="flex flex-wrap items-end gap-3">
        {labelField}
        {orderField}
        {loc ? (
          <label className="flex items-center gap-1.5 pb-1 text-xs">
            <input
              type="checkbox"
              name="active"
              defaultChecked={loc.active}
              className="size-3.5 rounded border-input"
            />
            Active
          </label>
        ) : null}
      </div>
    );
  }

  return (
    <HubFieldRow>
      {labelField}
      {orderField}
      {loc ? (
        <label className="flex items-end gap-1.5 pb-1 text-xs">
          <input
            type="checkbox"
            name="active"
            defaultChecked={loc.active}
            className="size-3.5 rounded border-input"
          />
          Active
        </label>
      ) : null}
    </HubFieldRow>
  );
}

function LocationEditForm({ loc }: { loc: BookingLocationTypeRow }) {
  const [state, action, pending] = useActionState(
    updateBookingLocationType.bind(null, loc.id),
    EMPTY,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBookingLocationType.bind(null, loc.id),
    EMPTY,
  );
  const busy = pending || deletePending;

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-end gap-2">
        <LocationFormFields loc={loc} idPrefix={`edit-${loc.id}-`} layout="row" />
        <Button type="submit" size="sm" disabled={busy}>
          {pending ? "…" : "Save"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          variant="outline"
          size="sm"
          disabled={busy}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            if (!confirm(`Delete location type "${loc.label}"?`)) {
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

function LocationListRow({
  loc,
  expanded,
  onToggleEdit,
}: {
  loc: BookingLocationTypeRow;
  expanded: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80",
        !loc.active && "opacity-75",
        expanded && "border-primary/30",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-sm text-primary">{loc.label}</span>
          <span className="ml-2 font-mono text-[9px] text-muted-foreground">
            order {loc.sort_order}
          </span>
          {!loc.active ? (
            <Badge variant="outline" className="ml-2 font-mono text-[8px]">
              Inactive
            </Badge>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToggleEdit}>
          {expanded ? "Close" : "Edit"}
        </Button>
      </div>
      {expanded ? <LocationEditForm loc={loc} /> : null}
    </Card>
  );
}

export function CatalogLocationsPanel({
  locations,
}: {
  locations: BookingLocationTypeRow[];
}) {
  const [createState, createAction, createPending] = useActionState(
    createBookingLocationType,
    EMPTY,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = locations.filter((l) => l.active);
  const inactive = locations.filter((l) => !l.active);

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

      <HubDetailsSection summary="+ Add location type">
        <form action={createAction} className="flex flex-wrap items-end gap-3">
          <LocationFormFields idPrefix="create-" layout="row" />
          <Button type="submit" disabled={createPending}>
            {createPending ? "Adding…" : "Add"}
          </Button>
          <HubActionAlert state={createState} className="w-full" />
        </form>
      </HubDetailsSection>

      <HubFormSection title="Location types" description="Shown on the booking form">
        {!active.length ? (
          <HubEmptyState>
            No active location types. Expand &ldquo;Add location type&rdquo; or run{" "}
            <code className="text-primary">npm run hub:seed</code>.
          </HubEmptyState>
        ) : (
          <ul className="space-y-2">
            {active.map((loc) => (
              <li key={loc.id}>
                <LocationListRow
                  loc={loc}
                  expanded={expandedId === loc.id}
                  onToggleEdit={() => toggleEdit(loc.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </HubFormSection>

      {inactive.length > 0 ? (
        <HubDetailsSection summary={`Inactive (${inactive.length})`}>
          <ul className="space-y-2">
            {inactive.map((loc) => (
              <li key={loc.id}>
                <LocationListRow
                  loc={loc}
                  expanded={expandedId === loc.id}
                  onToggleEdit={() => toggleEdit(loc.id)}
                />
              </li>
            ))}
          </ul>
        </HubDetailsSection>
      ) : null}
    </div>
  );
}
