"use client";

import { useActionState } from "react";

import {
  createBlackoutDate,
  deleteBlackoutDate,
  type HubRulesActionState,
} from "@/app/actions/hub-rules";
import { HubActionAlert, HubDetailsSection } from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubFormSection,
  HubInput,
  HubNativeSelect,
} from "@/components/hub/hub-form";
import { HubDatePicker } from "@/components/hub/hub-date-picker";
import { Button } from "@/components/ui/button";

const EMPTY: HubRulesActionState = { ok: false, message: "" };

export type BlackoutRow = {
  id: string;
  blackout_date: string;
  reason: string;
  service_area_slug: string | null;
  service_areas: { city: string } | null;
};

function DeleteBlackoutButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deleteBlackoutDate.bind(null, id),
    EMPTY,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Remove this blackout date?")) e.preventDefault();
      }}
    >
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "…" : "Remove"}
      </Button>
      {!state.ok && state.message ? (
        <span className="ml-2 font-mono text-[9px] text-destructive">{state.message}</span>
      ) : null}
    </form>
  );
}

export function BlackoutDatesPanel({
  blackouts,
  serviceAreas,
}: {
  blackouts: BlackoutRow[];
  serviceAreas: { slug: string; city: string }[];
}) {
  const [createState, createAction, createPending] = useActionState(
    createBlackoutDate,
    EMPTY,
  );

  return (
    <HubFormSection
      title="Shop closed dates"
      description={`${blackouts.length} scheduled`}
    >
      <HubDetailsSection summary="+ Add blackout">
        <form action={createAction}>
          <HubFieldRow>
            <HubDatePicker name="blackout_date" label="Date" disablePast />
            <HubFormField label="Scope" htmlFor="blackout-scope">
              <HubNativeSelect id="blackout-scope" name="service_area_slug" defaultValue="">
                <option value="">All locations</option>
                {serviceAreas.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.city} only
                  </option>
                ))}
              </HubNativeSelect>
            </HubFormField>
            <HubFormField label="Reason" htmlFor="blackout-reason" className="sm:col-span-2">
              <HubInput
                id="blackout-reason"
                name="reason"
                required
                placeholder="Holiday, weather, maintenance"
              />
            </HubFormField>
          </HubFieldRow>
          <Button type="submit" className="mt-4" size="sm" disabled={createPending}>
            {createPending ? "Adding…" : "Add blackout"}
          </Button>
          <HubActionAlert state={createState} className="mt-3" />
        </form>
      </HubDetailsSection>

      {!blackouts.length ? (
        <p className="text-sm text-muted-foreground">No upcoming blackouts on the calendar.</p>
      ) : (
        <ul className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border">
          {blackouts.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <span className="font-mono text-sm text-primary">{b.blackout_date}</span>
                <span className="ml-2 text-xs text-muted-foreground">{b.reason}</span>
                <span className="ml-2 font-mono text-[8px] text-muted-foreground/80">
                  {b.service_area_slug
                    ? (b.service_areas?.city ?? b.service_area_slug)
                    : "All locations"}
                </span>
              </div>
              <DeleteBlackoutButton id={b.id} />
            </li>
          ))}
        </ul>
      )}
    </HubFormSection>
  );
}
