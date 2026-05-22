"use client";

import { useActionState } from "react";

import {
  deleteOpenDayOverride,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { Button } from "@/components/ui/button";
import type { StaffDateOverride } from "@/lib/bookings/date-overrides";
import { dateInputToLabel } from "@/lib/hub/schedule-labels";
import { cn } from "@/lib/utils";

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
  variant = "default",
}: {
  overrides: StaffDateOverride[];
  variant?: "default" | "panel";
}) {
  if (!overrides.length) {
    return (
      <p className="text-sm text-text/40">
        {variant === "panel"
          ? "No extra work days match this filter."
          : "No exceptions yet. Use Working an off day when they pick up a shift on a normal off-day."}
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
    <ul className={variant === "panel" ? "space-y-2" : "space-y-4"}>
      {[...byStaff.entries()].map(([name, staffOverrides]) => (
        <li
          key={name}
          className={cn(
            "rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04]",
            variant === "panel" ? "px-3 py-2" : "px-4 py-3.5",
          )}
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
