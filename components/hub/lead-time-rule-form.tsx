"use client";

import { useActionState } from "react";

import {
  updateLeadTimeRule,
  type HubRulesActionState,
} from "@/app/actions/hub-rules";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMPTY: HubRulesActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-2.5 py-1.5 text-sm";
const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";

export type LeadTimeRuleRow = {
  rule_key: string;
  label: string;
  active: boolean;
  config: { timezone?: string; cutoff_hour?: number };
};

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

export function LeadTimeRuleForm({ rule }: { rule: LeadTimeRuleRow }) {
  const [state, action, pending] = useActionState(updateLeadTimeRule, EMPTY);
  const cutoff = rule.config.cutoff_hour ?? 16;

  return (
    <form action={action} className="rounded-lg border border-white/10 bg-card/30 p-4">
      <input type="hidden" name="rule_key" value={rule.rule_key} />

      <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
        Same-day booking cutoff
      </h2>
      <p className="mt-1 text-xs text-text/45">
        After this time (Central), today is not bookable on /book or in the hub.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={labelClass}>Label</span>
          <input name="label" defaultValue={rule.label} required className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Cutoff (Central)</span>
          <select name="cutoff_hour" defaultValue={String(cutoff)} className={fieldClass}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-1.5 pb-0.5 text-xs">
          <input
            type="checkbox"
            name="active"
            defaultChecked={rule.active}
            className="size-3.5"
          />
          Rule active
        </label>
      </div>

      <Button type="submit" className="mt-4 h-auto min-h-0 px-4 py-2 text-xs" disabled={pending}>
        {pending ? "Saving…" : "Save cutoff"}
      </Button>

      {state.message ? (
        <p
          className={cn(
            "mt-3 rounded border px-3 py-2 font-mono text-[10px]",
            state.ok
              ? "border-y/30 bg-y/10 text-y"
              : "border-red-500/30 bg-red-500/10 text-red-200",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
