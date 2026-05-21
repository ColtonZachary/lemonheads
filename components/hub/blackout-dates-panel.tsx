"use client";

import { useActionState } from "react";

import {
  createBlackoutDate,
  deleteBlackoutDate,
  type HubRulesActionState,
} from "@/app/actions/hub-rules";
import { Button } from "@/components/ui/button";

const EMPTY: HubRulesActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export type BlackoutRow = {
  id: string;
  blackout_date: string;
  reason: string;
  service_area_slug: string | null;
  service_areas: { city: string } | null;
};

function DeleteBlackoutButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deleteBlackoutDate.bind(null, id),
    EMPTY,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Remove this blackout date?")) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        variant="outline"
        className="h-auto min-h-0 px-2 py-1 text-[10px]"
        disabled={pending}
      >
        Remove
      </Button>
      {!state.ok && state.message && (
        <span className="ml-2 font-mono text-[9px] text-red-300">{state.message}</span>
      )}
    </form>
  );
}

export function BlackoutDatesPanel({
  blackouts,
  serviceAreas,
}: {
  blackouts: BlackoutRow[];
  serviceAreas: { slug: string; city: string }[];
}) {
  const [createState, createAction, createPending] = useActionState(
    createBlackoutDate,
    EMPTY,
  );

  return (
    <div className="space-y-8">
      <form action={createAction} className="rounded-md border border-white/10 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
          Add blackout date
        </h2>
        <p className="mt-1 font-mono text-[9px] text-text/35">
          Shop closed — whole company or one city only
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Date *</span>
            <input
              type="date"
              name="blackout_date"
              required
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Scope</span>
            <select name="service_area_slug" className={fieldClass} defaultValue="">
              <option value="">All locations (whole shop)</option>
              {serviceAreas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.city} only
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Reason *</span>
            <input
              name="reason"
              required
              placeholder="Christmas, weather, shop maintenance"
              className={fieldClass}
            />
          </label>
        </div>

        <Button type="submit" className="mt-6" disabled={createPending}>
          {createPending ? "Adding…" : "Add blackout"}
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

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Scheduled blackouts
        </h3>
        {!blackouts.length ? (
          <p className="mt-4 font-mono text-xs text-text/40">None on the calendar.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 rounded-md border border-white/10">
            {blackouts.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <div className="font-mono text-sm text-y/80">{b.blackout_date}</div>
                  <div className="text-sm text-text/60">{b.reason}</div>
                  <div className="font-mono text-[9px] text-text/35">
                    {b.service_area_slug
                      ? b.service_areas?.city ?? b.service_area_slug
                      : "All locations"}
                  </div>
                </div>
                <DeleteBlackoutButton id={b.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
