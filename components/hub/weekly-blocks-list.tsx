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
      onSubmit={(e) => {
        if (!confirm("Remove this recurring weekly block?")) e.preventDefault();
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

export function WeeklyBlocksList({ blocks }: { blocks: StaffWeeklyBlock[] }) {
  if (!blocks.length) {
    return (
      <p className="font-mono text-xs text-text/40">
        No recurring weekly blocks yet.
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
    <ul className="divide-y divide-white/10 rounded-md border border-white/10">
      {[...byStaff.entries()].map(([name, staffBlocks]) => (
        <li key={name} className="px-4 py-4">
          <div className="font-mono text-sm text-y/80">{name}</div>
          <ul className="mt-2 space-y-2">
            {staffBlocks
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm text-text/60"
                >
                  <span>
                    Every{" "}
                    <span className="text-text/80">
                      {WEEKDAY_LABELS[b.day_of_week]}
                    </span>
                    {b.reason ? ` · ${b.reason}` : ""}
                    <span className="ml-1 font-mono text-[9px] text-text/35">
                      (all day)
                    </span>
                  </span>
                  <DeleteWeeklyButton id={b.id} />
                </li>
              ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
