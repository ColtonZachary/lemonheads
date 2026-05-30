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

function DeleteOpenDayButton({ id, compact }: { id: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(
    deleteOpenDayOverride.bind(null, id),
    EMPTY,
  );

  if (compact) {
    return (
      <form
        action={action}
        className="inline"
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
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer font-mono text-[9px] text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          {pending ? "…" : "Remove"}
        </button>
        {!state.ok && state.message && (
          <span className="ml-1 font-mono text-[9px] text-red-300">{state.message}</span>
        )}
      </form>
    );
  }

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
      <p className="text-sm text-muted-foreground">
        {variant === "panel"
          ? "No extra work days match this filter."
          : "No exceptions yet. Use Working an off day when they pick up a shift on a normal off-day."}
      </p>
    );
  }

  const sorted = [...overrides].sort((a, b) =>
    a.override_date.localeCompare(b.override_date),
  );

  if (variant === "panel") {
    return (
      <ul className="divide-y divide-border/60">
        {sorted.map((o) => (
          <li
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-2 py-2"
          >
            <div className="min-w-0 text-[11px] text-muted-foreground">
              <span className="font-mono text-xs text-primary">
                {o.staff_members?.display_name ?? "—"}
              </span>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span className="text-emerald-200/80">
                {dateInputToLabel(o.override_date)}
              </span>
              {o.reason ? (
                <>
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  {o.reason}
                </>
              ) : null}
            </div>
            <DeleteOpenDayButton id={o.id} compact />
          </li>
        ))}
      </ul>
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
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3.5"
        >
          <div className="font-mono text-sm text-primary/85">{name}</div>
          <ul className="mt-3 space-y-2">
            {staffOverrides
              .sort((a, b) => a.override_date.localeCompare(b.override_date))
              .map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="text-foreground/65">
                    <span className="font-medium text-emerald-200/90">
                      {dateInputToLabel(o.override_date)}
                    </span>
                    {o.reason ? (
                      <span className="text-muted-foreground"> · {o.reason}</span>
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
