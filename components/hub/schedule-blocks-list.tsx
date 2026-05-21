"use client";

import { useActionState } from "react";

import {
  deleteScheduleBlock,
  type HubBlockActionState,
} from "@/app/actions/hub-blocks";
import { Button } from "@/components/ui/button";
import {
  formatBlockTimeRange,
  type BlockDateGroup,
} from "@/lib/hub/group-schedule-blocks";

const EMPTY: HubBlockActionState = { ok: false, message: "" };

function DeleteBlockButton({ blockId }: { blockId: string }) {
  const [state, action, pending] = useActionState(
    deleteScheduleBlock.bind(null, blockId),
    EMPTY,
  );

  return (
    <div>
      <form
        action={action}
        onSubmit={(e) => {
          if (!confirm("Remove this block from the calendar?")) e.preventDefault();
        }}
      >
        <Button
          type="submit"
          variant="outline"
          className="text-[10px] px-2 py-1 min-h-0 h-auto"
          disabled={pending}
        >
          {pending ? "…" : "Remove"}
        </Button>
      </form>
      {state.message && !state.ok && (
        <span className="ml-2 font-mono text-[9px] text-red-300">{state.message}</span>
      )}
    </div>
  );
}

export function ScheduleBlocksList({ groups }: { groups: BlockDateGroup[] }) {
  if (!groups.length) {
    return (
      <p className="mt-8 rounded-md border border-white/10 p-8 text-center font-mono text-xs text-text/40">
        No blocks scheduled. Add PTO or blocked time above.
      </p>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      {groups.map((day) => (
        <section key={day.dateKey}>
          <h2 className="border-b border-white/10 pb-2 font-display text-xl tracking-[0.05em] text-y/90">
            {day.dateLabel}
          </h2>
          <ul className="mt-3 divide-y divide-white/5">
            {day.blocks.map((block) => (
              <li
                key={block.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <div className="font-mono text-xs text-text/70">
                    {formatBlockTimeRange(block)}
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-y/80">
                      {block.staff_members?.display_name ?? "—"}
                    </span>
                    <span className="text-text/40"> · </span>
                    <span className="text-text/60">{block.reason}</span>
                  </div>
                </div>
                <DeleteBlockButton blockId={block.id} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
