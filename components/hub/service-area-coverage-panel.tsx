"use client";

import { useActionState } from "react";

import {
  addCoverageRule,
  deleteCoverageRule,
  updateServiceAreaTravelMinutes,
  type HubCoverageActionState,
} from "@/app/actions/hub-coverage";
import { HubActionAlert, HubDetailsSection, HubStatCard } from "@/components/hub/hub-page";
import {
  HubFieldRow,
  HubFormField,
  HubFormSection,
  HubInput,
  HubNativeSelect,
} from "@/components/hub/hub-form";
import { Button } from "@/components/ui/button";

const EMPTY: HubCoverageActionState = { ok: false, message: "" };

export type CoverageRuleRow = {
  id: string;
  service_area_slug: string;
  zip_prefix: string | null;
  city_name: string | null;
  active: boolean;
};

function DeleteCoverageButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deleteCoverageRule.bind(null, id),
    EMPTY,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Remove this coverage rule?")) e.preventDefault();
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

function formatRule(row: CoverageRuleRow): string {
  if (row.zip_prefix) return `ZIP ${row.zip_prefix}*`;
  if (row.city_name) return `City: ${row.city_name}`;
  return "—";
}

function TravelMinutesRow({
  area,
}: {
  area: { slug: string; city: string; state: string; travelMinutesFromShop: number };
}) {
  const [state, action, pending] = useActionState(
    updateServiceAreaTravelMinutes,
    EMPTY,
  );

  return (
    <form
      action={action}
      className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 px-3 py-2.5 last:border-0"
    >
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
          {area.city}, {area.state}
        </p>
        <p className="font-mono text-[9px] text-muted-foreground/80">
          {area.travelMinutesFromShop >= 60
            ? "Next-day booking · 8:30 AM earliest"
            : area.slug === "enid" || area.city.toLowerCase() === "enid"
              ? "8:30 AM earliest"
              : "Standard slots"}
        </p>
      </div>
      <input type="hidden" name="slug" value={area.slug} />
      <HubFormField label="Min from shop" htmlFor={`travel-${area.slug}`} className="w-auto">
        <HubInput
          id={`travel-${area.slug}`}
          name="travel_minutes"
          type="number"
          min={0}
          max={600}
          defaultValue={String(area.travelMinutesFromShop)}
          className="w-24 font-mono text-xs"
        />
      </HubFormField>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "…" : "Save"}
      </Button>
      {!state.ok && state.message ? (
        <span className="w-full font-mono text-[9px] text-destructive">{state.message}</span>
      ) : null}
    </form>
  );
}

export function ServiceAreaCoveragePanel({
  serviceAreas,
  rules,
}: {
  serviceAreas: {
    slug: string;
    city: string;
    state: string;
    travelMinutesFromShop: number;
  }[];
  rules: CoverageRuleRow[];
}) {
  const [createState, createAction, createPending] = useActionState(
    addCoverageRule,
    EMPTY,
  );

  const areaLabel = new Map(
    serviceAreas.map((a) => [a.slug, `${a.city}, ${a.state}`]),
  );

  const flatRules = rules.map((r) => ({
    ...r,
    areaName: areaLabel.get(r.service_area_slug) ?? r.service_area_slug,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <HubStatCard label="Service areas" value={serviceAreas.length} />
        <HubStatCard label="Active rules" value={rules.length} />
      </div>

      <HubFormSection
        title="Travel time from Edmond shop"
        description="Estimated drive minutes for booking rules — no Google API at checkout. 60+ min → next day · 8:30 earliest."
      >
        <ul className="rounded-lg border border-border">
          {serviceAreas.map((area) => (
            <TravelMinutesRow key={area.slug} area={area} />
          ))}
        </ul>
      </HubFormSection>

      <HubFormSection title="Coverage rules" description="Edmond drop-off always allowed">
        <HubDetailsSection summary="+ Add coverage rule">
          <form action={createAction}>
            <p className="text-xs text-muted-foreground">
              ZIP prefix matches ranges (e.g. 731 → all 731xx). City matches customer city
              field.
            </p>
            <HubFieldRow className="mt-3">
              <HubFormField label="Service area" htmlFor="coverage-area" required>
                <HubNativeSelect id="coverage-area" name="service_area_slug" required defaultValue="">
                  <option value="" disabled>
                    Select…
                  </option>
                  {serviceAreas.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.city}, {a.state}
                    </option>
                  ))}
                </HubNativeSelect>
              </HubFormField>
              <HubFormField label="Rule type" htmlFor="coverage-type" required>
                <HubNativeSelect id="coverage-type" name="rule_type" required defaultValue="zip">
                  <option value="zip">ZIP prefix</option>
                  <option value="city">City name</option>
                </HubNativeSelect>
              </HubFormField>
              <HubFormField label="Value" htmlFor="coverage-value" className="sm:col-span-2" required>
                <HubInput
                  id="coverage-value"
                  name="value"
                  required
                  placeholder="731 or Oklahoma City"
                />
              </HubFormField>
            </HubFieldRow>
            <Button type="submit" className="mt-4" size="sm" disabled={createPending}>
              {createPending ? "Adding…" : "Add rule"}
            </Button>
            <HubActionAlert state={createState} className="mt-3" />
          </form>
        </HubDetailsSection>

        {!flatRules.length ? (
          <p className="rounded-lg border border-border px-4 py-6 text-sm text-muted-foreground">
            No rules — mobile bookings allowed everywhere until you add ZIP or city rules.
            Run <code className="text-primary/80">npm run hub:seed</code> for defaults.
          </p>
        ) : (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border">
            {flatRules.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2 last:border-0"
              >
                <div className="min-w-0 text-sm">
                  <span className="font-mono text-[9px] text-primary/70">{r.areaName}</span>
                  <span className="ml-2 text-foreground/80">{formatRule(r)}</span>
                </div>
                <DeleteCoverageButton id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </HubFormSection>
    </div>
  );
}
