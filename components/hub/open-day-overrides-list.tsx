"use client";

import { useActionState } from "react";

import {
  deleteOpenDayOverride,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { Button } from "@/components/ui/button";
import type { StaffDateOverride } from "@/lib/bookings/date-overrides";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";

const EMPTY: HubBlockActionState = { ok: false, message: "" };

function DeleteOpenDayButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deleteOpenDayOverride.bind(null, id),
    EMPTY,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Remove this exception? They will not be bookable on this date if their weekly schedule says off.",
          )
        ) {
          e.preventDefault();
        }
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

export function OpenDayOverridesList({
  overrides,
}: {
  overrides: StaffDateOverride[];
}) {
  if (!overrides.length) {
    return (
      <p className="text-sm text-text/40">
        No exceptions yet. Use{" "}
        <span className="text-text/55">Working an off day</span> when someone wants
        to work a Saturday (or other day) they are normally off every week.
      </p>
    );
  }

  const byStaff = new Map<string, StaffDateOverride[]>();
  for (const o of overrides) {
    const name = o.staff_members?.display_name ?? "Unknown";
    const list = byStaff.get(name) ?? [];
    list.push(o);
    byStaff.set(name, list);
  }

  return (
    <ul className="space-y-4">
      {[...byStaff.entries()].map(([name, staffOverrides]) => (
        <li
          key={name}
          className="rounded border border-emerald-500/15 bg-emerald-500/[0.03] px-4 py-3"
        >
          <div className="font-mono text-sm text-y/85">{name}</div>
          <ul className="mt-3 space-y-2">
            {staffOverrides
              .sort((a, b) => a.override_date.localeCompare(b.override_date))
              .map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="text-text/65">
                    <span className="font-medium text-emerald-200/90">
                      {dateInputToLabel(o.override_date)}
                    </span>
                    {o.reason ? (
                      <span className="text-text/45"> · {o.reason}</span>
                    ) : null}
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.08em] text-emerald-400/60">
                      Bookable
                    </span>
                  </span>
                  <DeleteOpenDayButton id={o.id} />
                </li>
              ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
