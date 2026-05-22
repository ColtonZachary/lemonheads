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

function DeleteBlockButton({ blockId, compact }: { blockId: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(
    deleteScheduleBlock.bind(null, blockId),
    EMPTY,
  );

  if (compact) {
    return (
      <form
        action={action}
        className="inline"
        onSubmit={(e) => {
          if (!confirm("Remove this block from the calendar?")) e.preventDefault();
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer font-mono text-[9px] text-text/40 hover:text-red-300 disabled:opacity-50"
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
          className="h-auto min-h-0 px-2 py-1 text-[10px]"
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
  variant = "default",
}: {
  groups: BlockDateGroup[];
  embedded?: boolean;
  variant?: "default" | "panel";
}) {
  if (!groups.length) {
    return (
      <p className="text-sm text-text/40">
        {variant === "panel"
          ? "No blocked dates match this filter."
          : "No blocked dates in the next few months. Use Time off to add PTO or vacation."}
      </p>
    );
  }

  if (variant === "panel") {
    const flat = groups.flatMap((day) =>
      day.blocks.map((block) => ({ day, block })),
    );
    return (
      <ul className="divide-y divide-white/5">
        {flat.map(({ day, block }) => (
          <li
            key={block.id}
            className="flex flex-wrap items-center justify-between gap-2 py-2"
          >
            <div className="min-w-0 flex-1 text-[11px] text-text/55">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-red-200/70">
                {day.dateLabel}
              </span>
              <span className="mx-1.5 text-text/25">·</span>
              <span className="font-mono text-xs text-y/85">
                {block.staff_members?.display_name ?? "—"}
              </span>
              <span className="mx-1.5 text-text/25">·</span>
              {formatBlockTimeRange(block)}
              {block.reason ? (
                <>
                  <span className="mx-1.5 text-text/25">·</span>
                  {block.reason}
                </>
              ) : null}
            </div>
            <DeleteBlockButton blockId={block.id} compact />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className={
        embedded ? "space-y-4" : "mt-10 space-y-8"
      }
    >
      {groups.map((day) => (
        <section
          key={day.dateKey}
          className="overflow-hidden rounded-lg border border-red-500/15 bg-red-500/[0.03]"
        >
          <h3 className="border-b border-red-500/10 bg-red-500/[0.06] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-red-200/80">
            {day.dateLabel}
          </h3>
          <ul className="divide-y divide-white/5">
            {day.blocks.map((block) => (
              <li
                key={block.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
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
