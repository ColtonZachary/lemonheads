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

export function ScheduleBlocksList({
  groups,
  embedded = false,
}: {
  groups: BlockDateGroup[];
  embedded?: boolean;
}) {
  if (!groups.length) {
    return (
      <p className="text-sm text-text/40">
        No blocked dates in the next few months. Use{" "}
        <span className="text-text/55">Time off or busy</span> above for PTO,
        vacation, or partial-day blocks.
      </p>
    );
  }

  return (
    <div className={embedded ? "space-y-6" : "mt-10 space-y-8"}>
      {groups.map((day) => (
        <section
          key={day.dateKey}
          className="rounded border border-red-500/10 bg-red-500/[0.02] px-4 py-3"
        >
          <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-red-200/70">
            {day.dateLabel}
          </h3>
          <ul className="mt-2 space-y-2">
            {day.blocks.map((block) => (
              <li
                key={block.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-2 first:border-0 first:pt-0"
              >
                <div>
                  <div className="font-mono text-sm text-y/80">
                    {block.staff_members?.display_name ?? "—"}
                  </div>
                  <div className="mt-0.5 text-sm text-text/55">
                    {formatBlockTimeRange(block)}
                    {block.reason ? (
                      <>
                        <span className="text-text/30"> · </span>
                        {block.reason}
                      </>
                    ) : null}
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
