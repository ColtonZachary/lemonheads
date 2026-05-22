"use client";

import { useActionState, useState } from "react";

import {
  createBookingLocationType,
  deleteBookingLocationType,
  updateBookingLocationType,
  type HubCatalogActionState,
} from "@/app/actions/hub-catalog";
import { Button } from "@/components/ui/button";
import type { BookingLocationTypeRow } from "@/lib/hub/catalog-db";
import { cn } from "@/lib/utils";

const EMPTY: HubCatalogActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

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
  const feedback = deleteState.message || state.message;
  const feedbackOk = deleteState.message ? deleteState.ok : state.ok;

  return (
    <form
      action={action}
      className="border-t border-white/10 bg-white/[0.02] px-3 py-3 sm:px-4"
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1">
          <span className={labelClass}>Label</span>
          <input name="label" required defaultValue={loc.label} className={fieldClass} />
        </label>
        <label className="w-20">
          <span className={labelClass}>Order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={String(loc.sort_order)}
            className={fieldClass}
          />
        </label>
        <label className="flex items-center gap-1.5 pb-1 text-xs">
          <input type="checkbox" name="active" defaultChecked={loc.active} className="size-3.5" />
          Active
        </label>
        <Button type="submit" disabled={busy} className="h-auto min-h-0 px-3 py-1.5 text-xs">
          {pending ? "…" : "Save"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          variant="outline"
          disabled={busy}
          className="h-auto min-h-0 border-red-500/30 px-3 py-1.5 text-xs text-red-200"
          onClick={(e) => {
            if (!confirm(`Delete location type "${loc.label}"?`)) {
              e.preventDefault();
            }
          }}
        >
          {deletePending ? "…" : "Delete"}
        </Button>
      </div>
      {feedback ? (
        <p className={cn("mt-2 w-full font-mono text-[10px]", feedbackOk ? "text-y" : "text-red-200")}>
          {feedback}
        </p>
      ) : null}
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
    <li
      className={cn(
        "overflow-hidden rounded-lg border",
        loc.active ? "border-white/10" : "border-white/5 opacity-75",
        expanded && "border-y/25",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-sm text-y/90">{loc.label}</span>
          <span className="ml-2 font-mono text-[9px] text-text/40">order {loc.sort_order}</span>
          {!loc.active ? (
            <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[8px] text-text/50">
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
      {expanded ? <LocationEditForm loc={loc} /> : null}
    </li>
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
          + Add location type
        </summary>
        <form
          action={createAction}
          className="flex flex-wrap items-end gap-2 border-t border-white/10 px-4 py-4"
        >
          <label className="min-w-[12rem] flex-1">
            <span className={labelClass}>Label *</span>
            <input name="label" required placeholder="Home driveway" className={fieldClass} />
          </label>
          <label className="w-20">
            <span className={labelClass}>Order</span>
            <input name="sort_order" type="number" defaultValue="99" className={fieldClass} />
          </label>
          <Button type="submit" disabled={createPending} className="h-auto min-h-0 px-4 py-2 text-xs">
            {createPending ? "Adding…" : "Add"}
          </Button>
          {createState.message ? (
            <p
              className={cn(
                "w-full rounded border px-3 py-2 font-mono text-[10px]",
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
            Location types
          </h2>
          <span className="font-mono text-[9px] text-text/35">Shown on the booking form</span>
        </div>
        {!active.length ? (
          <p className="rounded-lg border border-white/10 px-4 py-6 text-sm text-text/40">
            No active location types. Expand &ldquo;Add location type&rdquo; or run{" "}
            <code className="text-y/70">npm run hub:seed</code>.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((loc) => (
              <LocationListRow
                key={loc.id}
                loc={loc}
                expanded={expandedId === loc.id}
                onToggleEdit={() => toggleEdit(loc.id)}
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
            {inactive.map((loc) => (
              <LocationListRow
                key={loc.id}
                loc={loc}
                expanded={expandedId === loc.id}
                onToggleEdit={() => toggleEdit(loc.id)}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
