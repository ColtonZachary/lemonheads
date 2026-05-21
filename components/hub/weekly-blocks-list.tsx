"use client";

import { useActionState } from "react";

import {
  deleteWeeklyBlock,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { Button } from "@/components/ui/button";
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
        className="ml-1 cursor-pointer font-mono text-[10px] text-text/35 hover:text-red-300 disabled:opacity-50"
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

export function WeeklyBlocksList({ blocks }: { blocks: StaffWeeklyBlock[] }) {
  if (!blocks.length) {
    return (
      <p className="text-sm text-text/40">
        No weekly pattern yet. Use{" "}
        <span className="text-text/55">Regular days off</span> above — for example
        check Saturday and Sunday if they never work weekends.
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

  return (
    <ul className="space-y-4">
      {[...byStaff.entries()].map(([name, staffBlocks]) => {
        const sorted = [...staffBlocks].sort((a, b) => a.day_of_week - b.day_of_week);
        const reason = sorted.find((b) => b.reason)?.reason;

        return (
          <li
            key={name}
            className="rounded border border-amber-500/15 bg-amber-500/[0.03] px-4 py-3"
          >
            <div className="font-mono text-sm text-y/85">{name}</div>
            <p className="mt-1 text-sm text-text/50">
              Off every week on{" "}
              {sorted.map((b) => WEEKDAY_LABELS[b.day_of_week]).join(", ")}
              {reason ? (
                <>
                  {" "}
                  · <span className="text-text/60">{reason}</span>
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
