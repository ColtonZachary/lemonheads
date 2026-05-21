"use client";

import { useActionState } from "react";

import {
  updateLeadTimeRule,
  type HubRulesActionState,
} from "@/app/actions/hub-rules";
import { Button } from "@/components/ui/button";

const EMPTY: HubRulesActionState = { ok: false, message: "" };

const fieldClass =
  "mt-1 w-full rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";
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
    <form action={action} className="rounded-md border border-white/10 p-6">
      <input type="hidden" name="rule_key" value={rule.rule_key} />

      <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-y">
        Same-day booking cutoff
      </h2>
      <p className="mt-1 font-mono text-[9px] text-text/35">
        After this time (Central), customers cannot book for today on the public site
        (enforcement wired in a later step).
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Label (shown in hub)</span>
          <input
            name="label"
            defaultValue={rule.label}
            required
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Cutoff hour (0–23, Central)</span>
          <select name="cutoff_hour" defaultValue={String(cutoff)} className={fieldClass}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {h} — {formatHour(h)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={rule.active}
            className="size-4"
          />
          <span>Rule active</span>
        </label>
      </div>

      <Button type="submit" className="mt-6" disabled={pending}>
        {pending ? "Saving…" : "Save rule"}
      </Button>

      {state.message && (
        <p
          className={`mt-4 rounded-md border px-4 py-3 font-mono text-xs ${
            state.ok
              ? "border-y/30 bg-y/10 text-y"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
