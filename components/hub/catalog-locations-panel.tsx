"use client";

import { useActionState } from "react";

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
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
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
    <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
      <label className="min-w-[200px] flex-1">
        <span className={labelClass}>Label</span>
        <input name="label" required defaultValue={loc.label} className={fieldClass} />
      </label>
      <label className="w-24">
        <span className={labelClass}>Order</span>
        <input
          name="sort_order"
          type="number"
          defaultValue={String(loc.sort_order)}
          className={fieldClass}
        />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={loc.active} className="size-4" />
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
          if (!confirm(`Delete location type “${loc.label}”?`)) {
            e.preventDefault();
          }
        }}
      >
        {deletePending ? "…" : "Delete"}
      </Button>
      {feedback && (
        <p className={cn("w-full font-mono text-xs", feedbackOk ? "text-y" : "text-red-200")}>
          {feedback}
        </p>
      )}
    </form>
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

  return (
    <div className="space-y-10">
      <form
        action={createAction}
        className="flex flex-wrap items-end gap-3 rounded-md border border-white/10 p-6"
      >
        <h2 className="w-full font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Add location type
        </h2>
        <label className="min-w-[200px] flex-1">
          <span className={labelClass}>Label *</span>
          <input name="label" required placeholder="Home driveway" className={fieldClass} />
        </label>
        <label className="w-24">
          <span className={labelClass}>Order</span>
          <input name="sort_order" type="number" defaultValue="99" className={fieldClass} />
        </label>
        <Button type="submit" disabled={createPending} className="h-auto min-h-0">
          {createPending ? "Adding…" : "Add"}
        </Button>
        {createState.message && (
          <p
            className={`w-full rounded-md border px-4 py-3 font-mono text-xs ${
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
          Location types ({locations.length})
        </h3>
        {!locations.length ? (
          <p className="mt-4 text-sm text-text/40">
            No location types. Run <code className="text-y/70">npm run hub:seed</code> or add one
            above.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {locations.map((loc) => (
              <li
                key={loc.id}
                className={cn(
                  "rounded-md border px-4 py-4",
                  loc.active ? "border-white/10" : "border-white/5 opacity-60",
                )}
              >
                {!loc.active && (
                  <span className="mb-2 inline-block rounded bg-white/10 px-2 py-0.5 font-mono text-[9px] text-text/50">
                    Inactive
                  </span>
                )}
                <LocationEditForm loc={loc} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
