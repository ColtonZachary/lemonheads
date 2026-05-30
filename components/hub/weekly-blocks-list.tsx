"use client";

import { useActionState } from "react";

import {
  deleteWeeklyBlock,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { WEEKDAY_LABELS, type StaffWeeklyBlock } from "@/lib/bookings/weekly-blocks";

const EMPTY: HubBlockActionState = { ok: false, message: "" };

function DeleteWeeklyButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deleteWeeklyBlock.bind(null, id),
    EMPTY,
  );

  return (
    <form
      action={action}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Remove this day from their weekly pattern?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer font-mono text-[9px] text-muted-foreground hover:text-destructive disabled:opacity-50"
        aria-label="Remove"
      >
        {pending ? "…" : "×"}
      </button>
      {!state.ok && state.message && (
        <span className="ml-1 font-mono text-[9px] text-red-300">{state.message}</span>
      )}
    </form>
  );
}

export function WeeklyBlocksList({
  blocks,
  variant = "default",
}: {
  blocks: StaffWeeklyBlock[];
  variant?: "default" | "panel";
}) {
  if (!blocks.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {variant === "panel"
          ? "No weekly off-days match this filter."
          : "No weekly pattern yet. Choose Regular days off and check the weekdays they never work."}
      </p>
    );
  }

  const byStaff = new Map<string, StaffWeeklyBlock[]>();
  for (const b of blocks) {
    const name = b.staff_members?.display_name ?? "Unknown";
    const list = byStaff.get(name) ?? [];
    list.push(b);
    byStaff.set(name, list);
  }

  if (variant === "panel") {
    return (
      <ul className="divide-y divide-border/60">
        {[...byStaff.entries()].map(([name, staffBlocks]) => {
          const sorted = [...staffBlocks].sort((a, b) => a.day_of_week - b.day_of_week);
          const reason = sorted.find((b) => b.reason)?.reason;
          const days = sorted.map((b) => WEEKDAY_LABELS[b.day_of_week]).join(", ");

          return (
            <li
              key={name}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs text-primary">{name}</span>
                <span className="ml-2 text-[11px] text-muted-foreground">
                  Off: {days}
                  {reason ? (
                    <span className="text-muted-foreground/80"> · {reason}</span>
                  ) : null}
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                {sorted.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground"
                  >
                    {WEEKDAY_LABELS[b.day_of_week]}
                    <DeleteWeeklyButton id={b.id} />
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-4">
      {[...byStaff.entries()].map(([name, staffBlocks]) => {
        const sorted = [...staffBlocks].sort((a, b) => a.day_of_week - b.day_of_week);
        const reason = sorted.find((b) => b.reason)?.reason;

        return (
          <li
            key={name}
            className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3.5"
          >
            <div className="font-mono text-sm text-primary/85">{name}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Off every week on{" "}
              {sorted.map((b) => WEEKDAY_LABELS[b.day_of_week]).join(", ")}
              {reason ? (
                <>
                  {" "}
                  · <span className="text-foreground/60">{reason}</span>
                </>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sorted.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] text-amber-100/80"
                >
                  {WEEKDAY_LABELS[b.day_of_week]}
                  <DeleteWeeklyButton id={b.id} />
                </span>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
