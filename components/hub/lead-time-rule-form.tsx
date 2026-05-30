"use client";

import { useActionState } from "react";

import {
  updateLeadTimeRule,
  type HubRulesActionState,
} from "@/app/actions/hub-rules";
import { HubActionAlert } from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubFormSection,
  HubInput,
  HubNativeSelect,
} from "@/components/hub/hub-form";
import { Button } from "@/components/ui/button";

const EMPTY: HubRulesActionState = { ok: false, message: "" };

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
    <HubFormSection
      title="Same-day booking cutoff"
      description="After this time (Central), today is not bookable on /book or in the hub."
    >
      <form action={action}>
        <input type="hidden" name="rule_key" value={rule.rule_key} />
        <HubFieldRow>
          <HubFormField label="Label" htmlFor="cutoff-label" className="sm:col-span-2 lg:col-span-3">
            <HubInput id="cutoff-label" name="label" defaultValue={rule.label} required />
          </HubFormField>
          <HubFormField label="Cutoff (Central)" htmlFor="cutoff-hour">
            <HubNativeSelect id="cutoff-hour" name="cutoff_hour" defaultValue={String(cutoff)}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </HubNativeSelect>
          </HubFormField>
          <label className="flex items-end gap-2 pb-1 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={rule.active}
              className="size-4 rounded border-input"
            />
            Rule active
          </label>
        </HubFieldRow>

        <Button type="submit" className="mt-4" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save cutoff"}
        </Button>
        <HubActionAlert state={state} className="mt-3" />
      </form>
    </HubFormSection>
  );
}
