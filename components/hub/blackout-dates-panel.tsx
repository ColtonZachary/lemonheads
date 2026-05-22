"use client";

import { useActionState } from "react";

import {
  createBlackoutDate,
  deleteBlackoutDate,
  type HubRulesActionState,
} from "@/app/actions/hub-rules";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMPTY: HubRulesActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
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
        {pending ? "…" : "Remove"}
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Shop closed dates
        </h2>
        <span className="font-mono text-[9px] text-text/35">{blackouts.length} scheduled</span>
      </div>

      <details className="rounded-lg border border-white/10 bg-card/30">
        <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-y [&::-webkit-details-marker]:hidden">
          + Add blackout
        </summary>
        <form action={createAction} className="border-t border-white/10 px-4 py-4">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <HubDatePicker name="blackout_date" label="Date" disablePast />
            <label className="block">
              <span className={labelClass}>Scope</span>
              <select name="service_area_slug" className={fieldClass} defaultValue="">
                <option value="">All locations</option>
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
                placeholder="Holiday, weather, maintenance"
                className={fieldClass}
              />
            </label>
          </div>
          <Button
            type="submit"
            className="mt-4 h-auto min-h-0 px-4 py-2 text-xs"
            disabled={createPending}
          >
            {createPending ? "Adding…" : "Add blackout"}
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

      {!blackouts.length ? (
        <p className="text-sm text-text/40">No upcoming blackouts on the calendar.</p>
      ) : (
        <ul className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-white/10">
          {blackouts.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2 last:border-0"
            >
              <div className="min-w-0">
                <span className="font-mono text-sm text-y/85">{b.blackout_date}</span>
                <span className="ml-2 text-xs text-text/50">{b.reason}</span>
                <span className="ml-2 font-mono text-[8px] text-text/35">
                  {b.service_area_slug
                    ? b.service_areas?.city ?? b.service_area_slug
                    : "All locations"}
                </span>
              </div>
              <DeleteBlackoutButton id={b.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
